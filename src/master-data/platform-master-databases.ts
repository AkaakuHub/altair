import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { completeResourceVersionSchema } from '../master-archive/domain/resource-version.ts';
import type { ActiveMasterRouteSelection } from './active-master-repository.ts';
import type { SelectedMasterRelease } from './selected-master-release.ts';

const identifier = z.string().regex(/^[a-z][a-z0-9_]*$/u);
const platformRowSchema = z
	.object({
		platform: z.enum(['android', 'ios']),
		release_id: z.string().regex(/^[0-9a-f]{64}$/u),
		client_version: z.string().min(1),
		resource_version: completeResourceVersionSchema,
		table_aliases_json: z.string(),
	})
	.strict();
const aliasesSchema = z.record(identifier, identifier.nullable());

export function openPlatformMasterDatabases(
	database: Database,
	databasePath: string,
	release: SelectedMasterRelease,
):
	| Readonly<
			Record<
				'android' | 'ios',
				ActiveMasterRouteSelection & { clientVersion: string }
			>
	  >
	| undefined {
	const sources = database
		.query<{ identity: string; sha256: string }, []>(
			"SELECT identity, sha256 FROM active_database_source WHERE kind = 'platform-selection'",
		)
		.all();
	if (sources.length === 0) return undefined;
	const source = sources[0];
	if (sources.length !== 1 || source?.identity !== release.releaseId)
		throw new Error('Platform master source identity differs');
	const rows = z
		.array(platformRowSchema)
		.parse(
			database
				.query(
					'SELECT platform, release_id, client_version, resource_version, table_aliases_json FROM runtime_platform_selection ORDER BY platform',
				)
				.all(),
		);
	if (
		createHash('sha256').update(JSON.stringify(rows)).digest('hex') !==
		source.sha256
	)
		throw new Error('Platform master selection fingerprint differs');
	const android = rows.find((row) => row.platform === 'android');
	const ios = rows.find((row) => row.platform === 'ios');
	if (rows.length !== 2 || android === undefined || ios === undefined)
		throw new Error('Platform master selection requires both platforms');
	if (
		android.resource_version !== release.androidResourceVersion ||
		ios.resource_version !== release.iosResourceVersion
	)
		throw new Error('Platform master resource versions differ from selection');
	const iosDatabase = new Database(databasePath, {
		readonly: true,
		strict: true,
	});
	try {
		projectTables(database, android.table_aliases_json);
		projectTables(iosDatabase, ios.table_aliases_json);
		return {
			android: {
				masterReleaseId: android.release_id,
				clientVersion: android.client_version,
				database,
			},
			ios: {
				masterReleaseId: ios.release_id,
				clientVersion: ios.client_version,
				database: iosDatabase,
			},
		};
	} catch (error) {
		iosDatabase.close();
		throw error;
	}
}

function projectTables(database: Database, aliasesJson: string) {
	const aliases = aliasesSchema.parse(JSON.parse(aliasesJson));
	for (const [name, target] of Object.entries(aliases)) {
		if (target !== null) {
			const table = database
				.query<{ name: string }, [string]>(
					"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
				)
				.get(target);
			if (table === null) throw new Error('Platform master table is missing');
		}
		database.exec(
			`CREATE TEMP VIEW "${name}" AS SELECT * FROM main."${target ?? `__unavailable_${name}`}"`,
		);
	}
}
