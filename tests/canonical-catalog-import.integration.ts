import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { importCanonicalCatalogs } from '../src/canonical-catalog-import/infrastructure/node-canonical-catalog-import.ts';

const resourceVersion = 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==';
const clientVersion = '5.1.0';
const identity = `${clientVersion}__${Buffer.from(resourceVersion).toString('base64url')}`;
const temporaryRoots: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryRoots
			.splice(0)
			.map((root) => rm(root, { recursive: true, force: true })),
	);
});

describe('canonical catalog import', () => {
	test('Android gzip JSONをbyte-identicalにcopyし、同一destinationをexistingにする', async () => {
		const root = await temporaryRoot();
		const sourceRoot = join(root, 'source');
		const canonicalRoot = join(root, 'canonical');
		const sourcePath = join(sourceRoot, `${identity}__cache__catalog.json.gz`);
		const sourceBytes = androidCatalogBytes();
		await writeBytes(sourcePath, sourceBytes);

		const copied = await importCanonicalCatalogs({
			platform: 'android',
			sourceRoot,
			canonicalRoot,
			databaseRoot: canonicalRoot,
		});
		expect(copied.status).toBe('succeeded');
		expect(copied.counts).toEqual({ copied: 1, existing: 0, failed: 0 });
		expect(copied.entries[0]?.identity).toEqual({
			platform: 'android',
			clientVersion,
			resourceVersion,
		});
		const destinationPath = join(
			canonicalRoot,
			'android',
			identity,
			'cache',
			'catalog.json.gz',
		);
		expect(await readFile(destinationPath)).toEqual(Buffer.from(sourceBytes));
		const database = new Database(
			join(canonicalRoot, 'android', identity, 'cache', 'catalog.sqlite3'),
			{ readonly: true },
		);
		try {
			expect(
				database
					.query(
						'SELECT label, ext, resource_type AS resourceType, size FROM bundle',
					)
					.get(),
			).toEqual({
				label: 'carddatas.tsv',
				ext: 'tsv',
				resourceType: 192,
				size: 12,
			});
			expect(
				database
					.query(
						"SELECT name FROM sqlite_master WHERE type = 'index' AND name IN ('bundle_label', 'bundle_content_label') ORDER BY name",
					)
					.all(),
			).toEqual([{ name: 'bundle_content_label' }, { name: 'bundle_label' }]);
		} finally {
			database.close();
		}

		const existing = await importCanonicalCatalogs({
			platform: 'android',
			sourceRoot,
			canonicalRoot,
			databaseRoot: canonicalRoot,
		});
		expect(existing.status).toBe('succeeded');
		expect(existing.counts).toEqual({ copied: 0, existing: 1, failed: 0 });
	});

	test('iOS SQLiteのfilenameとmetadataを照合してbyte-identicalにcopyする', async () => {
		const root = await temporaryRoot();
		const sourceRoot = join(root, 'source');
		const canonicalRoot = join(root, 'canonical');
		const sourcePath = join(sourceRoot, `${identity}.sqlite3`);
		await writeIosCatalog(sourcePath, {
			clientVersion,
			resourceVersion,
		});
		const sourceBytes = await readFile(sourcePath);

		const result = await importCanonicalCatalogs({
			platform: 'ios',
			sourceRoot,
			canonicalRoot,
			databaseRoot: canonicalRoot,
		});

		expect(result.status).toBe('succeeded');
		expect(result.counts).toEqual({ copied: 1, existing: 0, failed: 0 });
		expect(
			await readFile(join(canonicalRoot, 'ios', `${identity}.sqlite3`)),
		).toEqual(sourceBytes);
	});

	test('iOS SQLite metadata不一致をfailedにし、destinationを作成しない', async () => {
		const root = await temporaryRoot();
		const sourceRoot = join(root, 'source');
		const canonicalRoot = join(root, 'canonical');
		await writeIosCatalog(join(sourceRoot, `${identity}.sqlite3`), {
			clientVersion: '5.0.0',
			resourceVersion,
		});

		const result = await importCanonicalCatalogs({
			platform: 'ios',
			sourceRoot,
			canonicalRoot,
			databaseRoot: canonicalRoot,
		});

		expect(result.status).toBe('failed');
		expect(result.counts).toEqual({ copied: 0, existing: 0, failed: 1 });
		expect(result.entries[0]?.error?.code).toBe('catalog-metadata-mismatch');
		expect(
			Bun.file(join(canonicalRoot, 'ios', `${identity}.sqlite3`)).size,
		).toBe(0);
	});

	test('同一identityの複数sourceをcollisionとして全てfailedにする', async () => {
		const root = await temporaryRoot();
		const sourceRoot = join(root, 'source');
		const canonicalRoot = join(root, 'canonical');
		const filename = `${identity}__cache__catalog.json.gz`;
		await writeBytes(
			join(sourceRoot, 'first', filename),
			androidCatalogBytes(),
		);
		await writeBytes(
			join(sourceRoot, 'second', filename),
			androidCatalogBytes(),
		);

		const result = await importCanonicalCatalogs({
			platform: 'android',
			sourceRoot,
			canonicalRoot,
			databaseRoot: canonicalRoot,
		});

		expect(result.status).toBe('failed');
		expect(result.counts).toEqual({ copied: 0, existing: 0, failed: 2 });
		expect(result.entries.map((entry) => entry.error?.code)).toEqual([
			'catalog-identity-collision',
			'catalog-identity-collision',
		]);
	});

	test('既存destinationのbytes不一致をfailedにして上書きしない', async () => {
		const root = await temporaryRoot();
		const sourceRoot = join(root, 'source');
		const canonicalRoot = join(root, 'canonical');
		await writeBytes(
			join(sourceRoot, `${identity}__cache__catalog.json.gz`),
			androidCatalogBytes(),
		);
		const destinationPath = join(
			canonicalRoot,
			'android',
			identity,
			'cache',
			'catalog.json.gz',
		);
		const existingBytes = Buffer.from('different');
		await writeBytes(destinationPath, existingBytes);

		const result = await importCanonicalCatalogs({
			platform: 'android',
			sourceRoot,
			canonicalRoot,
			databaseRoot: canonicalRoot,
		});

		expect(result.status).toBe('failed');
		expect(result.counts).toEqual({ copied: 0, existing: 0, failed: 1 });
		expect(result.entries[0]?.error?.code).toBe('catalog-destination-conflict');
		expect(await readFile(destinationPath)).toEqual(existingBytes);
	});
});

async function temporaryRoot(): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'canonical-catalog-import-'));
	temporaryRoots.push(root);
	return root;
}

function androidCatalogBytes(): Uint8Array {
	return gzipSync(
		JSON.stringify([
			{
				Priority: 0,
				ResourceType: 192,
				Size: 12,
				StrTypeCrc: 'tsv',
				StrContentTypeCrcs: [],
				StrCategoryCrcs: ['masterdata'],
				StrLabelCrc: 'carddatas.tsv',
				StrContentNameCrcs: [],
				StrDepCrcs: [],
				Checksum: '34',
				Seed: '56',
			},
		]),
	);
}

async function writeIosCatalog(
	path: string,
	metadata: Readonly<{ clientVersion: string; resourceVersion: string }>,
): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	const separatorIndex = metadata.resourceVersion.indexOf('@');
	const database = new Database(path, { create: true, strict: true });
	try {
		database.exec(`
			CREATE TABLE metadata (
				app_version TEXT NOT NULL,
				platform TEXT NOT NULL,
				catalog_version TEXT NOT NULL,
				all_spec TEXT NOT NULL
			);
			CREATE TABLE bundle (
				uid INTEGER NOT NULL,
				label TEXT NOT NULL,
				ext TEXT NOT NULL,
				resource_type INTEGER NOT NULL,
				size INTEGER NOT NULL,
				checksum INTEGER NOT NULL,
				encryption_salt INTEGER NOT NULL,
				priority INTEGER NOT NULL
			);
			CREATE TABLE bundle_category (uid INTEGER NOT NULL, category TEXT NOT NULL);
			CREATE TABLE bundle_content (uid INTEGER NOT NULL, label TEXT NOT NULL, ext TEXT NOT NULL);
			CREATE TABLE bundle_dependency (uid INTEGER NOT NULL, dependency TEXT NOT NULL);
		`);
		database
			.query(
				'INSERT INTO metadata (app_version, platform, catalog_version, all_spec) VALUES (?, ?, ?, ?)',
			)
			.run(
				metadata.clientVersion,
				'iOS',
				metadata.resourceVersion.slice(0, separatorIndex),
				metadata.resourceVersion.slice(separatorIndex + 1),
			);
	} finally {
		database.close();
	}
}

async function writeBytes(path: string, bytes: Uint8Array): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	await Bun.write(path, bytes);
}
