import type { ActiveMasterSourceResult } from './active-database-build.ts';
import type { GenericMasterTable } from './generic-master-binary.ts';
import {
	type PlatformManifest,
	platformManifestIdentity,
} from './platform-manifest.ts';
import type { createMasterReleasePair } from './release-pair.ts';

export type CandidateMasterRelease = Readonly<{
	releaseIdentity: string;
	manifests: readonly [PlatformManifest, ...PlatformManifest[]];
	sourceIdentity: object;
	mapTable?: (
		platform: PlatformManifest['platform'],
		entry: Readonly<{
			tableLabel: string;
			blobSha256: string;
			schemaFingerprint: string;
			table: GenericMasterTable;
		}>,
	) => GenericMasterTable;
	additionalSources?: () => Promise<readonly ActiveMasterSourceResult[]>;
}>;

export function createOfficialActiveMasterRelease(
	pair: ReturnType<typeof createMasterReleasePair>,
): CandidateMasterRelease {
	return {
		releaseIdentity: pair.releaseId,
		manifests: [pair.android, pair.ios],
		sourceIdentity: { kind: 'official', android: pair.android, ios: pair.ios },
	};
}

export function createOfficialProfileActiveMasterRelease(
	manifest: PlatformManifest,
): CandidateMasterRelease {
	return {
		releaseIdentity: platformManifestIdentity(manifest),
		manifests: [manifest],
		sourceIdentity: { kind: 'official-profile', manifest },
	};
}
