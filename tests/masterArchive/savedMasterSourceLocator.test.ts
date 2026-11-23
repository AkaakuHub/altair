import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { canonicalCatalogRelativePath } from '../../src/canonical-catalog-import/domain/catalog-import-identity.ts';
import {
	locateSavedDerivedSources,
	savedCatalogProfiles,
} from '../../src/master-archive/infrastructure/saved-master-source-locator.ts';

describe('saved master source locator', () => {
	test('resource version索引から保存済みcatalogだけを解決する', async () => {
		const archiveRoot = await mkdtemp(join(tmpdir(), 'saved-master-sources-'));
		try {
			const saved = {
				archiveRoot,
				platform: 'android' as const,
				clientVersion: '6.0.0',
				resourceVersion: 'R2606100@saved',
			};
			const path = join(archiveRoot, canonicalCatalogRelativePath(saved));
			await mkdir(dirname(path), { recursive: true });
			await Bun.write(path, 'catalog');

			await expect(
				savedCatalogProfiles(
					{
						android: {
							'6.0.0': [saved.resourceVersion, 'R2606100@missing'],
						},
						ios: { '6.0.0': ['R2606100@missing'] },
					},
					archiveRoot,
				),
			).resolves.toEqual([
				{
					platform: saved.platform,
					clientVersion: saved.clientVersion,
					resourceVersion: saved.resourceVersion,
					path,
				},
			]);
		} finally {
			await rm(archiveRoot, { recursive: true, force: true });
		}
	});
});

test('追加の保存データを指定しない構築は空の入力を使う', async () => {
	expect(
		await locateSavedDerivedSources({
			DATA_ROOT: join(tmpdir(), 'empty-master-inputs'),
		}),
	).toEqual({
		webViewGacha: [],
	});
});
test('指定した追加データの不正な設定を空入力へ置換しない', async () => {
	await expect(
		locateSavedDerivedSources({ DATA_ROOT: 'relative' }),
	).rejects.toThrow();
	const root = await mkdtemp(join(tmpdir(), 'empty-webview-input-'));
	try {
		await mkdir(join(root, 'inputs', 'webview', 'gacha-detail'), {
			recursive: true,
		});
		await expect(
			locateSavedDerivedSources({ DATA_ROOT: root }),
		).rejects.toThrow('Saved WebView gacha sources are empty');
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
