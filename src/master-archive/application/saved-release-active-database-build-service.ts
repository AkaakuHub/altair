import type { ActiveDatabaseReleaseRequest } from '../domain/active-database-release-request.ts';
import {
	type CandidateMasterRelease,
	createOfficialActiveMasterRelease,
} from '../domain/active-master-release.ts';
import {
	createMasterReleasePair,
	parsePlatformManifests,
} from '../domain/release-pair.ts';
import {
	type PlatformReleaseSources,
	resolvePlatformReleaseSources,
} from './resolve-platform-release-sources.ts';

type CandidateBuildResult = Readonly<{
	unavailableReadModelTables: readonly string[];
	logicalDatabaseIdentity: string;
}>;

export class SavedReleaseActiveDatabaseBuildService {
	constructor(
		private readonly ports: Readonly<{
			manifestReader: { read(path: string): Promise<unknown> };
			candidateBuilder: {
				buildPlatformCandidate(
					sources: PlatformReleaseSources,
					candidatePath: string,
				): Promise<CandidateBuildResult>;
				buildCandidate(
					release: CandidateMasterRelease,
					candidatePath: string,
				): Promise<CandidateBuildResult>;
			};
		}>,
	) {}

	async build(
		input: Readonly<{
			androidManifestPath: string;
			iosManifestPath: string;
			release: ActiveDatabaseReleaseRequest;
			candidatePath: string;
		}>,
	): Promise<CandidateBuildResult> {
		const manifests = parsePlatformManifests(
			await Promise.all([
				this.ports.manifestReader.read(input.androidManifestPath),
				this.ports.manifestReader.read(input.iosManifestPath),
			]),
		);
		if (input.release.kind === 'platform-selection') {
			const sources = resolvePlatformReleaseSources(manifests);
			if (sources.releaseIdentity !== input.release.expectedReleaseIdentity)
				throw new Error(
					'Requested master release identity differs from inputs',
				);
			return await this.ports.candidateBuilder.buildPlatformCandidate(
				sources,
				input.candidatePath,
			);
		}
		const pair = createMasterReleasePair([manifests.android, manifests.ios]);
		const release = createOfficialActiveMasterRelease(pair);
		if (release.releaseIdentity !== input.release.expectedReleaseIdentity) {
			throw new Error('Requested master release identity differs from inputs');
		}
		return await this.ports.candidateBuilder.buildCandidate(
			release,
			input.candidatePath,
		);
	}
}
