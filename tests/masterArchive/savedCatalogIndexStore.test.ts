import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeSavedCatalogIndexStore } from '../../src/master-archive/infrastructure/node-saved-catalog-index-store.ts';
import type { BinaryCatalogEntry } from '../../src/resources/domain/assets/catalogBinary.ts';

const roots: string[] = [];
const identity = {
	platform: 'android' as const,
	clientVersion: '5.1.0',
	resourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
};
const entry: BinaryCatalogEntry = {
	priority: 0,
	resourceType: 192,
	size: 12,
	type: 'tsv',
	contents: [],
	categories: ['master'],
	label: 'carddatas.tsv',
	dependencies: [],
	checksum: 1n,
	encryptionSalt: 0n,
};
const entries: readonly BinaryCatalogEntry[] = [entry];

afterEach(async () => {
	await Promise.all(
		roots.splice(0).map((root) => rm(root, { recursive: true })),
	);
});

describe('NodeSavedCatalogIndexStore', () => {
	test('保存catalogから検索用SQLiteを生成し、同じ内容の再生成を受け入れる', async () => {
		const root = await mkdtemp(join(tmpdir(), 'saved-catalog-index-'));
		roots.push(root);
		const store = new NodeSavedCatalogIndexStore(root);

		const path = await store.write(identity, entries);
		await expect(store.write(identity, entries)).resolves.toBe(path);
		const database = new Database(path, { readonly: true, strict: true });
		try {
			expect(
				database
					.query('SELECT label, resource_type AS resourceType FROM bundle')
					.get(),
			).toEqual({ label: 'carddatas.tsv', resourceType: 192 });
		} finally {
			database.close();
		}
	});

	test('既存indexと生成内容が異なる場合は上書きしない', async () => {
		const root = await mkdtemp(join(tmpdir(), 'saved-catalog-index-'));
		roots.push(root);
		const store = new NodeSavedCatalogIndexStore(root);
		await store.write(identity, entries);

		await expect(
			store.write(identity, [{ ...entry, size: 13 }]),
		).rejects.toThrow('Saved catalog index conflicts');
	});
});
