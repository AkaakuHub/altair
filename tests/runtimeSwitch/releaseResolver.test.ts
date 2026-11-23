import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveOfficialRuntimeRelease } from '../../src/application/runtime-switch/runtime-switch-release-resolver.ts';
import type { PlatformManifest } from '../../src/master-archive/domain/platform-manifest.ts';
import { createMasterReleasePair } from '../../src/master-archive/domain/release-pair.ts';
import { masterManifestPath } from '../../src/master-archive/infrastructure/node-master-manifest-store.ts';

describe('runtime release resolver', () => {
	test('release IDから保存済みplatform manifestだけを解決する', async () => {
		const root = await mkdtemp(join(tmpdir(), 'runtime-release-'));
		try {
			const android = manifest('android');
			const ios = manifest('ios');
			for (const value of [android, ios]) {
				const path = masterManifestPath({
					archiveRoot: root,
					directory: 'manifests',
					platform: value.platform,
					resourceVersion: value.resourceVersion,
				});
				await mkdir(join(root, 'manifests', value.platform), {
					recursive: true,
				});
				await Bun.write(path, JSON.stringify(value));
			}
			const pair = createMasterReleasePair([android, ios]);
			await mkdir(join(root, 'releases'), { recursive: true });
			await Bun.write(
				join(root, 'releases', 'index.json'),
				JSON.stringify({
					[pair.releaseId]: {
						android: android.resourceVersion,
						ios: ios.resourceVersion,
					},
				}),
			);

			await expect(
				resolveOfficialRuntimeRelease(root, pair.releaseId),
			).resolves.toEqual({
				androidPath: masterManifestPath({
					archiveRoot: root,
					directory: 'manifests',
					platform: 'android',
					resourceVersion: android.resourceVersion,
				}),
				iosPath: masterManifestPath({
					archiveRoot: root,
					directory: 'manifests',
					platform: 'ios',
					resourceVersion: ios.resourceVersion,
				}),
			});
			await expect(
				resolveOfficialRuntimeRelease(root, '0'.repeat(64)),
			).rejects.toThrow('Runtime release ID is not saved');
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});

function manifest(platform: 'android' | 'ios'): PlatformManifest {
	return {
		schemaVersion: 1,
		platform,
		clientVersion: '6.0.0',
		resourceVersion:
			platform === 'android'
				? 'R2606100@MVUWvzmloZqHgjY6LMlGtcDXYQ=='
				: 'R2606100@SluahIGk1pjilFFncIJp6+DWYQ==',
		catalog: {
			identitySha256: platform === 'android' ? 'a'.repeat(64) : 'b'.repeat(64),
			sourceSha256: platform === 'android' ? 'c'.repeat(64) : 'd'.repeat(64),
		},
		tables: [],
	};
}
