import { Database } from 'bun:sqlite';
import {
	assertActiveMasterDatabaseIdentity,
	readActiveMasterDatabaseIdentity,
} from './active-master-database-identity.ts';
import type { ActiveMasterRepository } from './active-master-repository.ts';
import { openPlatformMasterDatabases } from './platform-master-databases.ts';
import { readSelectedMasterRelease } from './selected-master-release.ts';

export function openSqliteActiveMasterRepository(
	activeDatabasePath: string,
	selectedReleaseMetadataPath: string,
	readRelease = readSelectedMasterRelease,
): ActiveMasterRepository {
	const release = readRelease(selectedReleaseMetadataPath);
	const database = new Database(activeDatabasePath, {
		readonly: true,
		strict: true,
	});
	try {
		assertActiveMasterDatabaseIdentity(
			readActiveMasterDatabaseIdentity(database),
			release,
		);
		const platforms = openPlatformMasterDatabases(
			database,
			activeDatabasePath,
			release,
		);
		return {
			selection: {
				releaseId: release.releaseId,
				databaseFingerprint: release.databaseFingerprint,
				androidResourceVersion: release.androidResourceVersion,
				iosResourceVersion: release.iosResourceVersion,
				database,
				...(platforms === undefined ? {} : { platforms }),
			},
			close: () => {
				platforms?.ios.database.close();
				database.close();
			},
		};
	} catch (error) {
		database.close();
		throw error;
	}
}
