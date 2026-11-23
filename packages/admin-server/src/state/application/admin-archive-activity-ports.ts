import type { ArchivePrizeMaster } from '../../../../../src/state/archive-prize-definition.ts';
import type { EntityIdentityFingerprint } from '../../../../../src/state/entity-provenance.ts';
import type { JsonObject } from '../../../../../src/state/json-state-utils.ts';

export type AdminArchiveActivityReader = {
	readActivityRecordIdentityCatalog(): Readonly<{
		advFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
		seriesFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
	}>;
	readArchiveList(): JsonObject[];
	readArchiveWatchedIdentityCatalog(): Readonly<{
		withliveFingerprints: ReadonlyMap<string, EntityIdentityFingerprint>;
		fesFingerprints: ReadonlyMap<string, EntityIdentityFingerprint>;
	}>;
	findArchivePrizeMaster(liveId: string): ArchivePrizeMaster | undefined;
	findGiftLiveIdentityFingerprint(
		liveType: 'withlive' | 'withstation',
		liveId: string,
	): EntityIdentityFingerprint | undefined;
};
