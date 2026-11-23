import { Database } from 'bun:sqlite';
import type { BinaryCatalogEntry } from '../../domain/assets/catalogBinary.ts';
import { crc64 } from '../../domain/assets/crc64.ts';

export type SqliteCatalogMetadata = Readonly<{
	clientVersion: string;
	platform: 'android' | 'ios';
	resourceVersion: string;
}>;

export function createSqliteCatalog(
	entries: readonly BinaryCatalogEntry[],
	metadata: SqliteCatalogMetadata,
): Uint8Array {
	const separatorIndex = metadata.resourceVersion.indexOf('@');
	if (separatorIndex <= 0)
		throw new Error('Catalog resource version is invalid');
	const database = new Database(':memory:', {
		strict: true,
		safeIntegers: true,
	});
	try {
		database.exec(`
			CREATE TABLE metadata (app_version TEXT NOT NULL, platform TEXT NOT NULL, catalog_version TEXT NOT NULL, all_spec TEXT NOT NULL);
			CREATE TABLE bundle (uid INTEGER PRIMARY KEY, label TEXT NOT NULL, ext TEXT NOT NULL, resource_type INTEGER NOT NULL, size INTEGER NOT NULL, checksum INTEGER NOT NULL, encryption_salt INTEGER NOT NULL, priority INTEGER NOT NULL);
			CREATE TABLE bundle_category (uid INTEGER NOT NULL REFERENCES bundle(uid), category TEXT NOT NULL, UNIQUE(uid, category));
			CREATE TABLE bundle_content (uid INTEGER NOT NULL REFERENCES bundle(uid), label TEXT NOT NULL, ext TEXT NOT NULL);
			CREATE TABLE bundle_dependency (uid INTEGER NOT NULL REFERENCES bundle(uid), dependency TEXT NOT NULL);
			CREATE INDEX bundle_label ON bundle(label);
			CREATE INDEX bundle_category_uid ON bundle_category(uid);
			CREATE INDEX bundle_content_label ON bundle_content(label);
			CREATE INDEX bundle_content_uid ON bundle_content(uid);
			CREATE INDEX bundle_dependency_uid ON bundle_dependency(uid);
		`);
		database
			.query('INSERT INTO metadata VALUES (?, ?, ?, ?)')
			.run(
				metadata.clientVersion,
				metadata.platform,
				metadata.resourceVersion.slice(0, separatorIndex),
				metadata.resourceVersion.slice(separatorIndex + 1),
			);
		const insertBundle = database.query(
			'INSERT INTO bundle VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
		);
		const insertCategory = database.query(
			'INSERT INTO bundle_category VALUES (?, ?)',
		);
		const insertContent = database.query(
			'INSERT INTO bundle_content VALUES (?, ?, ?)',
		);
		const insertDependency = database.query(
			'INSERT INTO bundle_dependency VALUES (?, ?)',
		);
		const write = database.transaction(() => {
			for (const entry of entries) {
				const uid = signedUint64(crc64(new TextEncoder().encode(entry.label)));
				insertBundle.run(
					uid,
					entry.label,
					entry.type,
					entry.resourceType,
					entry.size,
					signedUint64(entry.checksum),
					signedUint64(entry.encryptionSalt),
					entry.priority,
				);
				for (const category of entry.categories)
					insertCategory.run(uid, category);
				for (const content of entry.contents)
					insertContent.run(uid, content.label, content.type);
				for (const dependency of entry.dependencies)
					insertDependency.run(uid, dependency);
			}
		});
		write();
		return database.serialize();
	} finally {
		database.close();
	}
}

function signedUint64(value: bigint): bigint {
	return value > 0x7fffffffffffffffn ? value - 0x10000000000000000n : value;
}
