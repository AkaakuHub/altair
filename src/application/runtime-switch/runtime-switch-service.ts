import { resolvePlatformReleaseSources } from '../../master-archive/application/resolve-platform-release-sources.ts';
import type { PlatformManifest } from '../../master-archive/domain/platform-manifest.ts';
import { parsePlatformManifest } from '../../master-archive/domain/platform-manifest.ts';
import { createMasterReleasePair } from '../../master-archive/domain/release-pair.ts';
import type { RuntimeMaintenanceState } from './runtime-maintenance-state.ts';
import {
	advanceRuntimeSwitch,
	type RuntimeSwitchEvent,
	type RuntimeSwitchState,
} from './runtime-switch-transition.ts';

type ManifestTarget = Readonly<{
	kind: string;
	manifests: { androidPath: string; iosPath: string };
}>;
export type OfficialRuntimeTarget = ManifestTarget &
	Readonly<{ kind: 'official' | 'platform-selection' }>;

export type RuntimeSwitchRequest<Target extends ManifestTarget> = Readonly<{
	expectedReleaseId: string;
	release: Target;
	activeDatabasePath: string;
	selectedReleasePath: string;
	representativeEndpointPath: string;
}>;

export type RuntimeReleaseResolver<Target extends ManifestTarget> = (
	request: Target,
	manifests: Readonly<{ android: PlatformManifest; ios: PlatformManifest }>,
	read: (path: string) => Promise<unknown>,
) => Promise<
	Readonly<{
		releaseIdentity: string;
		androidResourceVersion: string;
		iosResourceVersion: string;
		environment: Readonly<Record<string, string>>;
		metadata?: object;
	}>
>;

export const resolveOfficialRuntimeTarget: RuntimeReleaseResolver<
	OfficialRuntimeTarget
> = async (request, manifests) => {
	if (request.kind === 'platform-selection') {
		const sources = resolvePlatformReleaseSources(manifests);
		return {
			releaseIdentity: sources.releaseIdentity,
			androidResourceVersion: sources.android.resourceVersion,
			iosResourceVersion: sources.ios.resourceVersion,
			environment: {},
		};
	}
	const pair = createMasterReleasePair([manifests.android, manifests.ios]);
	return {
		releaseIdentity: pair.releaseId,
		androidResourceVersion: pair.android.resourceVersion,
		iosResourceVersion: pair.ios.resourceVersion,
		environment: {},
	};
};

export type RuntimeSwitchResult = Readonly<{
	releaseId: string;
	databaseFingerprint: string;
	androidResourceVersion: string;
	iosResourceVersion: string;
}>;

type CandidateDatabase = Readonly<{ path: string }>;
type CandidateDatabaseExchange = Readonly<{ previousPath: string }>;
type SelectedReleaseExchange = Readonly<{
	path: string;
	previousJson: string | null;
}>;

export type RuntimeSwitchPorts = Readonly<{
	manifestStore: {
		read(path: string): Promise<unknown>;
	};
	maintenanceStore: {
		write(state: RuntimeMaintenanceState): Promise<void>;
	};
	maintenanceProbe: {
		verify(state: RuntimeMaintenanceState): Promise<void>;
	};
	apiProcess: {
		stop(): Promise<void>;
		start(): Promise<void>;
	};
	candidateDatabase: {
		build(input: {
			kind: string;
			releaseId: string;
			environment: Readonly<Record<string, string>>;
			androidManifest: PlatformManifest;
			iosManifest: PlatformManifest;
			androidManifestPath: string;
			iosManifestPath: string;
			activeDatabasePath: string;
		}): Promise<CandidateDatabase>;
		verify(input: {
			candidate: CandidateDatabase;
			releaseId: string;
			androidManifest: PlatformManifest;
			iosManifest: PlatformManifest;
		}): Promise<Readonly<{ databaseFingerprint: string }>>;
		exchange(
			candidatePath: string,
			activePath: string,
		): Promise<CandidateDatabaseExchange>;
		rollback(
			exchange: CandidateDatabaseExchange,
			activePath: string,
		): Promise<void>;
		commit(exchange: CandidateDatabaseExchange): Promise<void>;
		discard(candidatePath: string): Promise<void>;
	};
	selectedReleaseStore: {
		exchange(
			path: string,
			metadata: Readonly<{
				schemaVersion: 1;
				releaseId: string;
				databaseFingerprint: string;
				androidResourceVersion: string;
				iosResourceVersion: string;
			}>,
		): Promise<SelectedReleaseExchange>;
		rollback(exchange: SelectedReleaseExchange): Promise<void>;
	};
	runtimeProbe: {
		verify(input: {
			releaseId: string;
			databaseFingerprint: string;
			androidResourceVersion: string;
			iosResourceVersion: string;
			representativeEndpointPath: string;
		}): Promise<void>;
	};
}>;

export class RuntimeSwitchService<Target extends ManifestTarget> {
	constructor(
		private readonly ports: RuntimeSwitchPorts,
		private readonly resolveRelease: RuntimeReleaseResolver<Target>,
	) {}

	async switch(
		request: RuntimeSwitchRequest<Target>,
	): Promise<RuntimeSwitchResult> {
		let state: RuntimeSwitchState = 'initial';
		const advance = (event: RuntimeSwitchEvent) => {
			state = advanceRuntimeSwitch(state, event);
		};
		const androidManifest = await this.readManifest(
			request.release.manifests.androidPath,
			'android',
		);
		const iosManifest = await this.readManifest(
			request.release.manifests.iosPath,
			'ios',
		);
		advance('manifests-validated');
		const release = await this.resolveRelease(
			request.release,
			{
				android: androidManifest,
				ios: iosManifest,
			},
			(path) => this.ports.manifestStore.read(path),
		);
		advance('pair-validated');
		if (release.releaseIdentity !== request.expectedReleaseId) {
			throw new Error(
				'Resolved runtime release differs from requested release ID',
			);
		}
		const maintenanceState: RuntimeMaintenanceState = {
			schemaVersion: 1,
			enabled: true,
			androidResourceVersion: release.androidResourceVersion,
			iosResourceVersion: release.iosResourceVersion,
		};
		let candidate: CandidateDatabase | undefined;
		let databaseExchange: CandidateDatabaseExchange | undefined;
		let selectedReleaseExchange: SelectedReleaseExchange | undefined;
		let maintenanceEnabled = false;
		let apiStopped = false;
		try {
			candidate = await this.ports.candidateDatabase.build({
				kind: request.release.kind,
				releaseId: release.releaseIdentity,
				environment: release.environment,
				androidManifest,
				iosManifest,
				androidManifestPath: request.release.manifests.androidPath,
				iosManifestPath: request.release.manifests.iosPath,
				activeDatabasePath: request.activeDatabasePath,
			});
			advance('candidate-built');
			const verification = await this.ports.candidateDatabase.verify({
				candidate,
				releaseId: release.releaseIdentity,
				androidManifest,
				iosManifest,
			});
			advance('candidate-verified');
			await this.ports.maintenanceStore.write(maintenanceState);
			maintenanceEnabled = true;
			advance('maintenance-enabled');
			await this.ports.maintenanceProbe.verify(maintenanceState);
			advance('public-maintenance-verified');
			await this.ports.apiProcess.stop();
			apiStopped = true;
			advance('api-stopped');
			databaseExchange = await this.ports.candidateDatabase.exchange(
				candidate.path,
				request.activeDatabasePath,
			);
			advance('active-database-exchanged');
			selectedReleaseExchange = await this.ports.selectedReleaseStore.exchange(
				request.selectedReleasePath,
				{
					...release.metadata,
					schemaVersion: 1,
					releaseId: release.releaseIdentity,
					databaseFingerprint: verification.databaseFingerprint,
					androidResourceVersion: release.androidResourceVersion,
					iosResourceVersion: release.iosResourceVersion,
				},
			);
			advance('selected-release-exchanged');
			await this.ports.apiProcess.start();
			apiStopped = false;
			advance('api-started');
			await this.ports.maintenanceStore.write({
				...maintenanceState,
				enabled: false,
			});
			maintenanceEnabled = false;
			advance('maintenance-disabled');
			await this.ports.runtimeProbe.verify({
				releaseId: release.releaseIdentity,
				databaseFingerprint: verification.databaseFingerprint,
				androidResourceVersion: release.androidResourceVersion,
				iosResourceVersion: release.iosResourceVersion,
				representativeEndpointPath: request.representativeEndpointPath,
			});
			advance('runtime-verified');
			await this.ports.candidateDatabase.commit(databaseExchange);
			return {
				releaseId: release.releaseIdentity,
				databaseFingerprint: verification.databaseFingerprint,
				androidResourceVersion: release.androidResourceVersion,
				iosResourceVersion: release.iosResourceVersion,
			};
		} catch (error) {
			const recoveryErrors: unknown[] = [];
			if (databaseExchange !== undefined && !apiStopped) {
				const errorCount = recoveryErrors.length;
				await recover(() => this.ports.apiProcess.stop(), recoveryErrors);
				apiStopped = recoveryErrors.length === errorCount;
			}
			if (selectedReleaseExchange !== undefined) {
				const exchange = selectedReleaseExchange;
				await recover(
					() => this.ports.selectedReleaseStore.rollback(exchange),
					recoveryErrors,
				);
			}
			if (databaseExchange !== undefined) {
				const exchange = databaseExchange;
				await recover(
					() =>
						this.ports.candidateDatabase.rollback(
							exchange,
							request.activeDatabasePath,
						),
					recoveryErrors,
				);
			} else if (candidate !== undefined) {
				const candidatePath = candidate.path;
				await recover(
					() => this.ports.candidateDatabase.discard(candidatePath),
					recoveryErrors,
				);
			}
			if (apiStopped) {
				await recover(() => this.ports.apiProcess.start(), recoveryErrors);
			}
			if (maintenanceEnabled) {
				await recover(
					() =>
						this.ports.maintenanceStore.write({
							...maintenanceState,
							enabled: false,
						}),
					recoveryErrors,
				);
			}
			if (recoveryErrors.length > 0) {
				throw new AggregateError(
					[error, ...recoveryErrors],
					'Runtime switch recovery failed',
				);
			}
			throw error;
		}
	}

	private async readManifest(
		path: string,
		expectedPlatform: 'android' | 'ios',
	): Promise<PlatformManifest> {
		const manifest = parsePlatformManifest(
			await this.ports.manifestStore.read(path),
		);
		if (manifest.platform !== expectedPlatform) {
			throw new Error(
				`${expectedPlatform} manifest path contains ${manifest.platform} manifest`,
			);
		}
		return manifest;
	}
}

async function recover(
	action: () => Promise<void>,
	errors: unknown[],
): Promise<void> {
	try {
		await action();
	} catch (error) {
		errors.push(error);
	}
}
