import { Database } from 'bun:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RuntimeMaintenanceState } from './runtime-maintenance-state.ts';
import {
	type RuntimeReleaseResolver,
	type RuntimeSwitchPorts,
	type RuntimeSwitchRequest,
	RuntimeSwitchService,
} from './runtime-switch-service.ts';

type ManifestStorePort = RuntimeSwitchPorts['manifestStore'];
type MaintenanceStorePort = RuntimeSwitchPorts['maintenanceStore'];
type SelectedReleaseStorePort = RuntimeSwitchPorts['selectedReleaseStore'];
type ApiProcessPort = RuntimeSwitchPorts['apiProcess'];
type CandidateDatabasePort = RuntimeSwitchPorts['candidateDatabase'];
type MaintenanceProbePort = RuntimeSwitchPorts['maintenanceProbe'];
type RuntimeProbePort = RuntimeSwitchPorts['runtimeProbe'];

const sha256Pattern = /^[0-9a-f]{64}$/u;
type RuntimeEndpoint = Readonly<{
	path: string;
	method: 'GET' | 'POST';
	headers: Readonly<Record<string, string>>;
	body?: unknown;
}>;
type RuntimeReadiness = Readonly<{
	timeoutMs: number;
	pollIntervalMs: number;
}>;
type NodeRuntimeSwitchInput<
	Target extends {
		kind: string;
		manifests: { androidPath: string; iosPath: string };
	},
> = Readonly<{
	expectedReleaseId: string;
	release: Target;
	archiveRoot: string;
	activeDatabasePath: string;
	selectedReleasePath: string;
}>;
const representativeEndpoint: RuntimeEndpoint = {
	path: '/v1/register/get_terms',
	method: 'POST',
	headers: {},
	body: {},
};
const officialMaintenanceBody = {
	error_code: '00004_000000',
	message:
		'ただいまメンテナンス中です。\nしばらく経ってからもう一度お試しください。',
	title: 'サーバーエラー',
};

export function createNodeRuntimeSwitch<
	Target extends {
		kind: string;
		manifests: { androidPath: string; iosPath: string };
	},
>(
	input: NodeRuntimeSwitchInput<Target>,
	resolveRelease: RuntimeReleaseResolver<Target>,
	options: Readonly<{
		controlScript: string;
		backendBaseUrl: string;
		publicApiBaseUrl: string;
	}>,
	buildCommand: readonly string[] = [
		process.execPath,
		fileURLToPath(
			new URL(
				'../../cli/build-saved-release-active-database.ts',
				import.meta.url,
			),
		),
	],
): Readonly<{
	service: RuntimeSwitchService<Target>;
	request: RuntimeSwitchRequest<Target>;
}> {
	const { controlScript, backendBaseUrl, publicApiBaseUrl } = options;
	return {
		service: new RuntimeSwitchService(
			{
				manifestStore: new NodeJsonManifestStore(),
				maintenanceStore: new AtomicMaintenanceStateStore(
					join(input.archiveRoot, 'runtime', 'maintenance.json'),
				),
				maintenanceProbe: new HttpMaintenanceProbe(
					publicApiBaseUrl,
					representativeEndpoint,
				),
				apiProcess: new CommandApiProcess(
					[controlScript, 'stop'],
					[controlScript, 'start'],
				),
				candidateDatabase: new CommandCandidateDatabase(buildCommand),
				selectedReleaseStore: new AtomicSelectedReleaseStore(),
				runtimeProbe: new HttpRuntimeProbe(
					backendBaseUrl,
					'/health',
					representativeEndpoint,
					{ timeoutMs: 60_000, pollIntervalMs: 500 },
				),
			},
			resolveRelease,
		),
		request: {
			expectedReleaseId: input.expectedReleaseId,
			release: input.release,
			activeDatabasePath: input.activeDatabasePath,
			selectedReleasePath: input.selectedReleasePath,
			representativeEndpointPath: representativeEndpoint.path,
		},
	};
}

class NodeJsonManifestStore implements ManifestStorePort {
	async read(path: string): Promise<unknown> {
		return JSON.parse(await readFile(path, 'utf8'));
	}
}

class AtomicMaintenanceStateStore implements MaintenanceStorePort {
	constructor(private readonly path: string) {}

	async write(state: RuntimeMaintenanceState): Promise<void> {
		await writeJsonAtomically(this.path, state);
	}
}

class AtomicSelectedReleaseStore implements SelectedReleaseStorePort {
	async exchange(
		path: string,
		metadata: Parameters<SelectedReleaseStorePort['exchange']>[1],
	): ReturnType<SelectedReleaseStorePort['exchange']> {
		const previousJson = await readOptionalText(path);
		await writeJsonAtomically(path, metadata);
		return { path, previousJson };
	}

	async rollback(
		exchange: Parameters<SelectedReleaseStorePort['rollback']>[0],
	): Promise<void> {
		if (exchange.previousJson === null) {
			await rm(exchange.path, { force: true });
			return;
		}
		await writeTextAtomically(exchange.path, exchange.previousJson);
	}
}

class CommandApiProcess implements ApiProcessPort {
	constructor(
		private readonly stopCommand: readonly string[],
		private readonly startCommand: readonly string[],
	) {}

	async stop(): Promise<void> {
		await runCommand(this.stopCommand, {});
	}

	async start(): Promise<void> {
		await runCommand(this.startCommand, {});
	}
}

export class CommandCandidateDatabase implements CandidateDatabasePort {
	constructor(
		private readonly buildCommand: readonly string[],
		private readonly commandRunner: typeof runCommand = runCommand,
	) {}

	async build(
		input: Parameters<CandidateDatabasePort['build']>[0],
	): Promise<{ path: string }> {
		const stagingDirectory = join(
			dirname(input.activeDatabasePath),
			'.staging',
		);
		await mkdir(stagingDirectory, { recursive: true });
		const path = join(stagingDirectory, `${randomUUID()}.sqlite`);
		try {
			await this.commandRunner(
				[
					...this.buildCommand,
					'--candidate',
					JSON.stringify({
						candidatePath: path,
						releaseId: input.releaseId,
						androidManifestPath: input.androidManifestPath,
						iosManifestPath: input.iosManifestPath,
						kind: input.kind,
					}),
				],
				input.environment,
			);
		} catch (error) {
			await removeSqliteFiles(path);
			throw error;
		}
		return { path };
	}

	async verify(
		input: Parameters<CandidateDatabasePort['verify']>[0],
	): Promise<{ databaseFingerprint: string }> {
		const database = new Database(input.candidate.path, {
			readonly: true,
			strict: true,
		});
		try {
			const integrity = database
				.query<{ integrity_check: string }, []>('PRAGMA integrity_check')
				.get();
			if (integrity?.integrity_check !== 'ok') {
				throw new Error('Candidate active database integrity check failed');
			}
			const metadataRows = database
				.query<{ key: string; value: string }, []>(
					'SELECT key, value FROM active_database_metadata',
				)
				.all();
			const metadata = new Map(metadataRows.map((row) => [row.key, row.value]));
			if (metadata.get('release_identity') !== input.releaseId) {
				throw new Error('Candidate active database release identity differs');
			}
			const databaseFingerprint = metadata.get('logical_database_identity');
			if (!databaseFingerprint || !sha256Pattern.test(databaseFingerprint)) {
				throw new Error('Candidate active database fingerprint is invalid');
			}
			verifySources(database, input);
			return { databaseFingerprint };
		} finally {
			database.close();
		}
	}

	async exchange(
		candidatePath: string,
		activePath: string,
	): ReturnType<CandidateDatabasePort['exchange']> {
		const previousPath = join(
			dirname(activePath),
			'.staging',
			`${randomUUID()}.previous.sqlite`,
		);
		await mkdir(dirname(previousPath), { recursive: true });
		await rename(activePath, previousPath);
		try {
			await rename(candidatePath, activePath);
		} catch (error) {
			await rename(previousPath, activePath);
			throw error;
		}
		return { previousPath };
	}

	async rollback(
		exchange: Parameters<CandidateDatabasePort['rollback']>[0],
		activePath: string,
	): Promise<void> {
		await removeSqliteFiles(activePath);
		await rename(exchange.previousPath, activePath);
	}

	async commit(
		exchange: Parameters<CandidateDatabasePort['commit']>[0],
	): Promise<void> {
		await removeSqliteFiles(exchange.previousPath);
	}

	async discard(candidatePath: string): Promise<void> {
		await removeSqliteFiles(candidatePath);
	}
}

async function removeSqliteFiles(path: string): Promise<void> {
	await Promise.all([
		rm(path, { force: true }),
		rm(`${path}-shm`, { force: true }),
		rm(`${path}-wal`, { force: true }),
	]);
}

class HttpMaintenanceProbe implements MaintenanceProbePort {
	constructor(
		private readonly baseUrl: string,
		private readonly endpoint: RuntimeEndpoint,
	) {}

	async verify(state: RuntimeMaintenanceState): Promise<void> {
		await verifyMaintenancePlatform(
			this.baseUrl,
			this.endpoint,
			'inspix-android/runtime-switch',
			state.androidResourceVersion,
		);
		await verifyMaintenancePlatform(
			this.baseUrl,
			this.endpoint,
			'inspix-ios/runtime-switch',
			state.iosResourceVersion,
		);
	}
}

class HttpRuntimeProbe implements RuntimeProbePort {
	constructor(
		private readonly baseUrl: string,
		private readonly healthPath: string,
		private readonly endpoint: RuntimeEndpoint,
		private readonly readiness: RuntimeReadiness,
	) {}

	async verify(
		input: Parameters<RuntimeProbePort['verify']>[0],
	): Promise<void> {
		await waitForApiReadiness(
			new URL(this.healthPath, this.baseUrl),
			this.readiness,
		);
		if (input.representativeEndpointPath !== this.endpoint.path) {
			throw new Error(
				'Representative endpoint path differs from runtime probe',
			);
		}
		await verifyRuntimePlatform(
			this.baseUrl,
			this.endpoint,
			'inspix-android/runtime-switch',
			input.androidResourceVersion,
		);
		await verifyRuntimePlatform(
			this.baseUrl,
			this.endpoint,
			'inspix-ios/runtime-switch',
			input.iosResourceVersion,
		);
	}
}

type ReadinessDependencies = Readonly<{
	fetch: (url: URL) => Promise<Response>;
	now: () => number;
	sleep: (milliseconds: number) => Promise<void>;
}>;

export async function waitForApiReadiness(
	healthUrl: URL,
	readiness: Readonly<{ timeoutMs: number; pollIntervalMs: number }>,
	dependencies: ReadinessDependencies = {
		fetch,
		now: Date.now,
		sleep: async (milliseconds) =>
			await new Promise((resolve) => setTimeout(resolve, milliseconds)),
	},
): Promise<void> {
	const deadline = dependencies.now() + readiness.timeoutMs;
	let lastFailure: Error | undefined;
	for (;;) {
		try {
			const response = await dependencies.fetch(healthUrl);
			if (response.ok) return;
			lastFailure = new Error(`API health check failed: ${response.status}`);
		} catch (error) {
			lastFailure = error instanceof Error ? error : new Error(String(error));
		}
		const remaining = deadline - dependencies.now();
		if (remaining <= 0) {
			throw new Error(
				`API readiness timed out after ${readiness.timeoutMs}ms`,
				{ cause: lastFailure },
			);
		}
		await dependencies.sleep(Math.min(readiness.pollIntervalMs, remaining));
	}
}

async function writeJsonAtomically(
	path: string,
	value: unknown,
): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	const temporaryPath = join(dirname(path), `.${randomUUID()}.json`);
	try {
		await writeFile(temporaryPath, `${JSON.stringify(value)}\n`, {
			flag: 'wx',
		});
		await rename(temporaryPath, path);
	} catch (error) {
		await rm(temporaryPath, { force: true });
		throw error;
	}
}

async function writeTextAtomically(path: string, value: string): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	const temporaryPath = join(dirname(path), `.${randomUUID()}.json`);
	try {
		await writeFile(temporaryPath, value, { flag: 'wx' });
		await rename(temporaryPath, path);
	} catch (error) {
		await rm(temporaryPath, { force: true });
		throw error;
	}
}

async function readOptionalText(path: string): Promise<string | null> {
	try {
		return await readFile(path, 'utf8');
	} catch (error) {
		if (isNodeError(error, 'ENOENT')) return null;
		throw error;
	}
}

function isNodeError(
	error: unknown,
	code: string,
): error is Error & { code: string } {
	return error instanceof Error && 'code' in error && error.code === code;
}

async function runCommand(
	command: readonly string[],
	environment: Readonly<Record<string, string>>,
): Promise<void> {
	const processHandle = Bun.spawn([...command], {
		env: { ...process.env, ...environment },
		stdin: 'ignore',
		stdout: 'inherit',
		stderr: 'inherit',
	});
	const exitCode = await processHandle.exited;
	if (exitCode !== 0) {
		throw new Error(`Command failed with exit code ${exitCode}: ${command[0]}`);
	}
}

function verifySources(
	database: Database,
	input: Parameters<CandidateDatabasePort['verify']>[0],
): void {
	const sources = database
		.query<{ sha256: string; schema_fingerprints_json: string }, []>(
			'SELECT sha256, schema_fingerprints_json FROM active_database_source',
		)
		.all();
	if (sources.length === 0) {
		throw new Error('Candidate active database source metadata is empty');
	}
	const actualFingerprints = new Set<string>();
	for (const source of sources) {
		if (!sha256Pattern.test(source.sha256)) {
			throw new Error('Candidate active database source hash is invalid');
		}
		const fingerprints: unknown = JSON.parse(source.schema_fingerprints_json);
		if (
			!Array.isArray(fingerprints) ||
			fingerprints.some(
				(value) => typeof value !== 'string' || !sha256Pattern.test(value),
			)
		) {
			throw new Error(
				'Candidate active database schema fingerprints are invalid',
			);
		}
		for (const fingerprint of fingerprints) actualFingerprints.add(fingerprint);
	}
	const expectedFingerprints = new Set(
		[...input.androidManifest.tables, ...input.iosManifest.tables].map(
			(table) => table.schemaFingerprint,
		),
	);
	for (const fingerprint of expectedFingerprints) {
		if (!actualFingerprints.has(fingerprint)) {
			throw new Error(
				`Candidate active database schema fingerprint is missing: ${fingerprint}`,
			);
		}
	}
}

async function verifyMaintenancePlatform(
	baseUrl: string,
	endpoint: RuntimeEndpoint,
	userAgent: string,
	expectedResourceVersion: string,
): Promise<void> {
	const response = await requestEndpoint(baseUrl, endpoint, userAgent);
	if (response.status !== 503) {
		throw new Error(`Public maintenance status differs: ${response.status}`);
	}
	if (response.headers.get('x-res-version') !== expectedResourceVersion) {
		throw new Error('Public maintenance resource version differs');
	}
	const body = await response.json();
	if (JSON.stringify(body) !== JSON.stringify(officialMaintenanceBody)) {
		throw new Error('Public maintenance body differs');
	}
}

async function verifyRuntimePlatform(
	baseUrl: string,
	endpoint: RuntimeEndpoint,
	userAgent: string,
	expectedResourceVersion: string,
): Promise<void> {
	const response = await requestEndpoint(baseUrl, endpoint, userAgent);
	if (!response.ok) {
		throw new Error(`Representative endpoint failed: ${response.status}`);
	}
	if (response.headers.get('x-res-version') !== expectedResourceVersion) {
		throw new Error('Representative endpoint resource version differs');
	}
}

async function requestEndpoint(
	baseUrl: string,
	endpoint: RuntimeEndpoint,
	userAgent: string,
): Promise<Response> {
	const headers = new Headers(endpoint.headers);
	headers.set('user-agent', userAgent);
	const init: RequestInit = { method: endpoint.method, headers };
	if (endpoint.body !== undefined) {
		headers.set('content-type', 'application/json');
		init.body = JSON.stringify(endpoint.body);
	}
	return fetch(new URL(endpoint.path, baseUrl), init);
}
