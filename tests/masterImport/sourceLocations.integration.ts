import { expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	locateSavedDerivedSources,
	resolveMasterArchiveRoot,
} from '../../src/master-archive/infrastructure/saved-master-source-locator.ts';

test('uses configured archive storage without assuming a home directory', () => {
	const root = join(tmpdir(), 'master-source-test');
	expect(resolveMasterArchiveRoot({ DATA_ROOT: root })).toBe(
		join(root, 'master-archive'),
	);
	expect(() => resolveMasterArchiveRoot({})).toThrow('DATA_ROOT is required');
});

test('locates supplied metadata without depending on sibling repositories', async () => {
	const root = await mkdtemp(join(tmpdir(), 'master-locations-'));
	try {
		const environment = {
			DATA_ROOT: root,
		};
		await Promise.all(
			[
				join(root, 'inputs', 'archives'),
				join(root, 'inputs', 'webview', 'gacha-detail'),
			].map((path) => mkdir(path, { recursive: true })),
		);
		await Bun.write(
			join(join(root, 'inputs', 'webview', 'gacha-detail'), 'sample.json'),
			'{}',
		);
		const sources = await locateSavedDerivedSources(environment);
		expect(sources.archiveList?.path).toBe(
			join(join(root, 'inputs', 'archives'), 'archive.json'),
		);
		expect(sources.webViewGacha.map((source) => source.identity)).toEqual([
			'sample',
		]);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
