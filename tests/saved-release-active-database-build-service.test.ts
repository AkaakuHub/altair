import { describe, expect, test } from 'bun:test';
import { SavedReleaseActiveDatabaseBuildService } from '../src/master-archive/application/saved-release-active-database-build-service.ts';
import { platformDatabaseReleaseIdentity } from '../src/master-archive/domain/platform-database-build.ts';
import { platformManifestIdentity } from '../src/master-archive/domain/platform-manifest.ts';
import { createMasterReleasePair } from '../src/master-archive/domain/release-pair.ts';

describe('SavedReleaseActiveDatabaseBuildService', () => {
	test('AndroidとiOSのmanifestが示すreleaseだけを指定pathへ構築する', async () => {
		const android = manifest(
			'android',
			'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
		);
		const ios = manifest('ios', 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==');
		const pair = createMasterReleasePair([android, ios]);
		const calls: Array<{
			releaseId: string;
			candidatePath: string;
		}> = [];
		const service = new SavedReleaseActiveDatabaseBuildService({
			manifestReader: {
				read: async (path) => (path === '/android.json' ? android : ios),
			},
			candidateBuilder: {
				buildPlatformCandidate: async () => {
					throw new Error('unexpected platform build');
				},
				buildCandidate: async (release, candidatePath) => {
					calls.push({ releaseId: release.releaseIdentity, candidatePath });
					return {
						unavailableReadModelTables: ['future.tsv'],
						logicalDatabaseIdentity: 'a'.repeat(64),
					};
				},
			},
		});

		const result = await service.build({
			androidManifestPath: '/android.json',
			iosManifestPath: '/ios.json',
			release: {
				kind: 'official',
				expectedReleaseIdentity: pair.releaseId,
			},
			candidatePath: '/runtime/candidate.sqlite',
		});

		expect(calls).toEqual([
			{
				releaseId: pair.releaseId,
				candidatePath: '/runtime/candidate.sqlite',
			},
		]);
		expect(result).toEqual({
			unavailableReadModelTables: ['future.tsv'],
			logicalDatabaseIdentity: 'a'.repeat(64),
		});
	});

	test('異なるOS版の指定identityを検証し、同じ保存先へ構築する', async () => {
		const android = manifest(
			'android',
			'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
		);
		const ios = {
			...manifest('ios', 'R2606100@SluahIGk1pjilFFncIJp6+DWYQ=='),
			clientVersion: '6.0.0',
		};
		const identity = platformDatabaseReleaseIdentity({
			android: platformManifestIdentity(android),
			ios: platformManifestIdentity(ios),
		});
		let count = 0;
		const service = new SavedReleaseActiveDatabaseBuildService({
			manifestReader: {
				read: async (path) => (path === '/android.json' ? android : ios),
			},
			candidateBuilder: {
				buildCandidate: async () => {
					throw new Error('unexpected shared build');
				},
				buildPlatformCandidate: async (manifests, path) => {
					expect({
						android: manifests.android.manifest,
						ios: manifests.ios.manifest,
					}).toEqual({ android, ios });
					expect(path).toBe('/candidate.sqlite');
					count += 1;
					return {
						unavailableReadModelTables: [],
						logicalDatabaseIdentity: 'f'.repeat(64),
					};
				},
			},
		});
		const input = {
			androidManifestPath: '/android.json',
			iosManifestPath: '/ios.json',
			candidatePath: '/candidate.sqlite',
			release: {
				kind: 'platform-selection' as const,
				expectedReleaseIdentity: identity,
			},
		};
		await service.build(input);
		expect(count).toBe(1);
		await expect(
			service.build({
				...input,
				release: { ...input.release, expectedReleaseIdentity: '0'.repeat(64) },
			}),
		).rejects.toThrow('identity differs');
		expect(count).toBe(1);
	});

	test('指定release IDがmanifest pairと異なる場合は構築しない', async () => {
		const android = manifest(
			'android',
			'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
		);
		const ios = manifest('ios', 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==');
		let buildCount = 0;
		const service = new SavedReleaseActiveDatabaseBuildService({
			manifestReader: {
				read: async (path) => (path === '/android.json' ? android : ios),
			},
			candidateBuilder: {
				buildPlatformCandidate: async () => {
					throw new Error('unexpected platform build');
				},
				buildCandidate: async () => {
					buildCount += 1;
					return {
						unavailableReadModelTables: [],
						logicalDatabaseIdentity: 'a'.repeat(64),
					};
				},
			},
		});

		await expect(
			service.build({
				androidManifestPath: '/android.json',
				iosManifestPath: '/ios.json',
				release: {
					kind: 'official',
					expectedReleaseIdentity: 'b'.repeat(64),
				},
				candidatePath: '/runtime/candidate.sqlite',
			}),
		).rejects.toThrow('Requested master release identity differs from inputs');
		expect(buildCount).toBe(0);
	});
});

function manifest(platform: 'android' | 'ios', resourceVersion: string) {
	return {
		schemaVersion: 1 as const,
		platform,
		clientVersion: '5.1.0',
		resourceVersion,
		catalog: {
			identitySha256: platform === 'android' ? 'a'.repeat(64) : 'b'.repeat(64),
			sourceSha256: platform === 'android' ? 'c'.repeat(64) : 'd'.repeat(64),
		},
		tables: [],
	};
}
