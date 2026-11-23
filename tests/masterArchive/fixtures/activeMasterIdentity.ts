import type { Database } from 'bun:sqlite';

export function createActiveMasterIdentityFixture(
	database: Database,
	releaseId: string,
	fingerprint: string,
): void {
	database.exec(`
  CREATE TABLE active_database_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE active_database_source (kind TEXT NOT NULL, identity TEXT NOT NULL, sha256 TEXT NOT NULL, schema_fingerprints_json TEXT NOT NULL, PRIMARY KEY (kind, identity));
 `);
	const insert = database.prepare(
		'INSERT INTO active_database_metadata VALUES (?, ?)',
	);
	insert.run('release_identity', releaseId);
	insert.run('logical_database_identity', fingerprint);
}
