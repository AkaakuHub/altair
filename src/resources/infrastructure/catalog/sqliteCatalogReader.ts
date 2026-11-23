import { Database } from 'bun:sqlite';
import { z } from 'zod';
import {
	catalogEntriesFromSqliteRows,
	type SqliteBundleRow,
	type SqliteContentRow,
	type SqliteRelatedRow,
} from '../../domain/assets/sqliteCatalogRows.ts';

const sqliteNumber = z.bigint().transform((value, context) => {
	const number = Number(value);
	if (!Number.isSafeInteger(number)) {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'SQLite integer exceeds safe number range',
		});
		return z.NEVER;
	}
	return number;
});

const bundleSchema = z.object({
	uid: z.bigint(),
	label: z.string(),
	type: z.string(),
	resourceType: sqliteNumber,
	size: sqliteNumber,
	checksum: z.bigint(),
	encryptionSalt: z.bigint(),
	priority: sqliteNumber,
});
const relatedSchema = z.object({ uid: z.bigint(), value: z.string() });
const contentSchema = z.object({
	uid: z.bigint(),
	label: z.string(),
	type: z.string(),
});

export function readSqliteCatalog(path: string) {
	const database = new Database(path, {
		readonly: true,
		strict: true,
		safeIntegers: true,
	});
	try {
		const bundles: SqliteBundleRow[] = z.array(bundleSchema).parse(
			queryRows(
				database,
				`SELECT uid, label, ext AS type, resource_type AS resourceType,
			 size, checksum, encryption_salt AS encryptionSalt, priority
			 FROM bundle ORDER BY rowid`,
			),
		);
		const categories: SqliteRelatedRow[] = z
			.array(relatedSchema)
			.parse(
				queryRows(
					database,
					'SELECT uid, category AS value FROM bundle_category ORDER BY rowid',
				),
			);
		const contents: SqliteContentRow[] = z
			.array(contentSchema)
			.parse(
				queryRows(
					database,
					'SELECT uid, label, ext AS type FROM bundle_content ORDER BY rowid',
				),
			);
		const dependencies: SqliteRelatedRow[] = z
			.array(relatedSchema)
			.parse(
				queryRows(
					database,
					'SELECT uid, dependency AS value FROM bundle_dependency ORDER BY rowid',
				),
			);
		return catalogEntriesFromSqliteRows(
			bundles,
			categories,
			contents,
			dependencies,
		);
	} finally {
		database.close();
	}
}

export function readSqliteCatalogByLabels(
	path: string,
	labels: readonly string[],
	resourceType?: number,
) {
	if (labels.length === 0) return [];
	const database = new Database(path, {
		readonly: true,
		strict: true,
		safeIntegers: true,
	});
	try {
		const placeholders = labels.map(() => '?').join(', ');
		const resourceFilter =
			resourceType === undefined ? '' : 'AND b.resource_type = ?';
		const parameters =
			resourceType === undefined
				? [...labels, ...labels]
				: [...labels, ...labels, resourceType];
		const rows = z.array(z.object({ uid: z.bigint() })).parse(
			queryRows(
				database,
				`WITH matching_uid(uid) AS (
				 	SELECT uid FROM bundle WHERE label IN (${placeholders})
				 	UNION
				 	SELECT uid FROM bundle_content WHERE label IN (${placeholders})
				 )
				 SELECT b.uid
				 FROM matching_uid m INNER JOIN bundle b ON b.uid = m.uid
				 WHERE 1 = 1
				 ${resourceFilter}`,
				parameters,
			),
		);
		return readEntriesByUids(
			database,
			rows.map(({ uid }) => uid),
		);
	} finally {
		database.close();
	}
}

export function readSqliteCatalogDependencyClosure(
	path: string,
	label: string,
	resourceType: number,
) {
	const database = new Database(path, {
		readonly: true,
		strict: true,
		safeIntegers: true,
	});
	try {
		const rows = z.array(z.object({ uid: z.bigint() })).parse(
			queryRows(
				database,
				`WITH RECURSIVE closure(uid) AS (
				 	SELECT uid FROM bundle WHERE label = ? AND resource_type = ?
				 	UNION
				 	SELECT dependency_entry.uid
				 	FROM closure current
				 	INNER JOIN bundle_dependency dependency
				 		ON dependency.uid = current.uid
				 	INNER JOIN bundle dependency_entry
				 		ON dependency_entry.label = dependency.dependency
				 	UNION
				 	SELECT dependency_content.uid
				 	FROM closure current
				 	INNER JOIN bundle_dependency dependency
				 		ON dependency.uid = current.uid
				 	INNER JOIN bundle_content dependency_content
				 		ON dependency_content.label = dependency.dependency
				 )
				 SELECT uid FROM closure`,
				[label, resourceType],
			),
		);
		return readEntriesByUids(
			database,
			rows.map(({ uid }) => uid),
		);
	} finally {
		database.close();
	}
}

function readEntriesByUids(database: Database, uids: readonly bigint[]) {
	if (uids.length === 0) return [];
	const uidPlaceholders = uids.map(() => '?').join(', ');
	const bundles = z.array(bundleSchema).parse(
		queryRows(
			database,
			`SELECT uid, label, ext AS type, resource_type AS resourceType,
			 size, checksum, encryption_salt AS encryptionSalt, priority
			 FROM bundle WHERE uid IN (${uidPlaceholders}) ORDER BY rowid`,
			uids,
		),
	);
	const categories = z.array(relatedSchema).parse(
		queryRows(
			database,
			`SELECT uid, category AS value FROM bundle_category
			 WHERE uid IN (${uidPlaceholders}) ORDER BY rowid`,
			uids,
		),
	);
	const contents = z.array(contentSchema).parse(
		queryRows(
			database,
			`SELECT uid, label, ext AS type FROM bundle_content
			 WHERE uid IN (${uidPlaceholders}) ORDER BY rowid`,
			uids,
		),
	);
	const dependencies = z.array(relatedSchema).parse(
		queryRows(
			database,
			`SELECT uid, dependency AS value FROM bundle_dependency
			 WHERE uid IN (${uidPlaceholders}) ORDER BY rowid`,
			uids,
		),
	);
	return catalogEntriesFromSqliteRows(
		bundles,
		categories,
		contents,
		dependencies,
	);
}

function queryRows(
	database: Database,
	sql: string,
	parameters: readonly (string | number | bigint)[] = [],
): unknown[] {
	return database.query(sql).all(...parameters);
}
