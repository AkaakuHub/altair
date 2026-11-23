import { Database } from 'bun:sqlite';
import { expect, test } from 'bun:test';
import { listRuntimeReleaseOptions } from '@altair/admin-server/runtime/application/admin-resource-version-options.ts';
import { serializeResourceVersion } from '../../src/resources/domain/assets/resourceVersion.ts';

const version = (revision: string, checksum: bigint) =>
	serializeResourceVersion({ revision, checksum, seed: 1n, size: 1000000 });

test('相手OSや検証済みペアの有無に関係なく、全履歴からOS別に選択できる', () => {
	const database = new Database(':memory:');
	try {
		const android = version('R2606002', 1n);
		const ios = version('R2606002', 2n);
		const old = version('R2404000', 3n);
		const options = listRuntimeReleaseOptions(
			{
				android: { '2.0.0': [old], '5.1.0': [android, 'source annotation'] },
				ios: { '5.1.0': [ios] },
			},
			{
				releaseId: 'a'.repeat(64),
				databaseFingerprint: 'b'.repeat(64),
				androidResourceVersion: android,
				iosResourceVersion: ios,
				database,
			},
		);
		expect(
			options.map(({ platform, resourceVersion }) => ({
				platform,
				resourceVersion,
			})),
		).toEqual([
			{ platform: 'android', resourceVersion: android },
			{ platform: 'android', resourceVersion: old },
			{ platform: 'ios', resourceVersion: ios },
		]);
		expect(options.filter((entry) => entry.isActive)).toHaveLength(2);
	} finally {
		database.close();
	}
});

test('異なるclient版を使うOSの選択をそれぞれ維持する', () => {
	const database = new Database(':memory:');
	try {
		const android = version('R2606002', 1n);
		const ios = version('R2606100', 2n);
		const options = listRuntimeReleaseOptions(
			{ android: { '5.1.0': [android] }, ios: { '6.0.0': [ios] } },
			{
				releaseId: 'a'.repeat(64),
				databaseFingerprint: 'b'.repeat(64),
				androidResourceVersion: android,
				iosResourceVersion: ios,
				database,
				platforms: {
					android: {
						masterReleaseId: 'c'.repeat(64),
						clientVersion: '5.1.0',
						database,
					},
					ios: {
						masterReleaseId: 'd'.repeat(64),
						clientVersion: '6.0.0',
						database,
					},
				},
			},
		);
		expect(
			options
				.filter((entry) => entry.isActive)
				.map(({ platform, clientVersion }) => ({ platform, clientVersion })),
		).toEqual([
			{ platform: 'android', clientVersion: '5.1.0' },
			{ platform: 'ios', clientVersion: '6.0.0' },
		]);
	} finally {
		database.close();
	}
});
