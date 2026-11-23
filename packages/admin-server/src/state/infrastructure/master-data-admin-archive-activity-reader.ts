import type { Database } from 'bun:sqlite';
import { getActivityRecordMasterIdentityCatalogFromDatabase } from '../../../../../src/master-data/activity-record-master.ts';
import {
	getArchiveIdentityFingerprints,
	getGiftLiveIdentityFingerprint,
} from '../../../../../src/master-data/archive-identity.ts';
import {
	getArchiveListFromDatabase,
	getArchivePrizeMasterFromDatabase,
} from '../../../../../src/master-data/archive-master-data.ts';
import type { AdminArchiveActivityReader } from '../application/admin-archive-activity-ports.ts';

export class MasterDataAdminArchiveActivityReader
	implements AdminArchiveActivityReader
{
	constructor(private readonly database: Database) {}

	readActivityRecordIdentityCatalog() {
		return getActivityRecordMasterIdentityCatalogFromDatabase(this.database);
	}

	readArchiveList() {
		return getArchiveListFromDatabase(this.database);
	}

	readArchiveWatchedIdentityCatalog() {
		return {
			withliveFingerprints: getArchiveIdentityFingerprints(
				this.database,
				'withlive',
			),
			fesFingerprints: getArchiveIdentityFingerprints(this.database, 'fes'),
		};
	}

	findArchivePrizeMaster(liveId: string) {
		return getArchivePrizeMasterFromDatabase(this.database, liveId);
	}

	findGiftLiveIdentityFingerprint(
		liveType: 'withlive' | 'withstation',
		liveId: string,
	) {
		return getGiftLiveIdentityFingerprint(this.database, liveType, liveId);
	}
}
