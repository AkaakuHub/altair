import type { Database } from 'bun:sqlite';
import type { SelectedMasterRelease } from './selected-master-release.ts';

export function readActiveMasterDatabaseIdentity(database: Database) {
	const rows = database
		.query<{ key: string; value: string }, []>(
			"SELECT key, value FROM active_database_metadata WHERE key IN ('release_identity', 'logical_database_identity')",
		)
		.all();
	const values = new Map(rows.map((entry) => [entry.key, entry.value]));
	return {
		releaseId: values.get('release_identity'),
		databaseFingerprint: values.get('logical_database_identity'),
	};
}

export function assertActiveMasterDatabaseIdentity(
	identity: ReturnType<typeof readActiveMasterDatabaseIdentity>,
	release: Pick<SelectedMasterRelease, 'releaseId' | 'databaseFingerprint'>,
): void {
	if (identity.releaseId !== release.releaseId)
		throw new Error('active database release identity differs from selection');
	if (identity.databaseFingerprint !== release.databaseFingerprint)
		throw new Error('active database fingerprint differs from selection');
}
