import { describe, expect, test } from 'bun:test';
import {
	type SavedMasterVersionProfile,
	SavedMasterVersionsImportService,
} from '../src/master-archive/application/saved-master-versions-import-service.ts';
import type {
	MasterArchivePlatform,
	MasterResourceCatalog,
	MasterResourceImportResult,
} from '../src/master-archive/domain/master-resource-import.ts';
import { ReleaseCandidateCompatibilityError } from '../src/master-archive/domain/release-candidate-compatibility.ts';

const androidVersion = 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==';
const iosVersion = 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==';

function profile(
	platform: MasterArchivePlatform,
	resourceVersion: string,
	catalog: MasterResourceCatalog | null = null,
): SavedMasterVersionProfile {
	const resolvedCatalog =
		catalog ??
		({
			readMasterEntries: async () => [
				imported(platform, resourceVersion, 'decoded').entry,
			],
		} satisfies MasterResourceCatalog);
	return {
		platform,
		clientVersion: '5.1.0',
		resourceVersion,
		catalogSourceSha256: catalog === missingCatalog ? null : 'a'.repeat(64),
		catalog: catalog === missingCatalog ? null : resolvedCatalog,
	};
}

const missingCatalog = { readMasterEntries: async () => [] };

function imported(
	platform: MasterArchivePlatform,
	resourceVersion: string,
	status: MasterResourceImportResult['status'],
): MasterResourceImportResult {
	return {
		entry: {
			platform,
			resourceVersion,
			tableLabel: 'carddatas.tsv',
			catalogResourceIdentity: `${platform === 'android' ? 'b' : 'c'}`.repeat(
				64,
			),
			assetPath: 'raw/aa/abcdefghijklmnopqrstuvwxyz',
			encryptedSize: 10,
			catalogChecksum: '12',
			encryptionSalt: '34',
		},
		status,
		encryptedSha256: 'd'.repeat(64),
		blobSha256: 'e'.repeat(64),
		blobWriteResult: platform === 'android' ? 'stored' : 'already-present',
		schemaFingerprint: 'f'.repeat(64),
		rowCount: 1,
	};
}

describe('saved master versions import service', () => {
	test('writes both catalog manifests before classifying schema resolution', async () => {
		const writes: string[] = [];
		const importer = createService(
			[
				imported('android', androidVersion, 'decoded'),
				imported('ios', iosVersion, 'schema-unresolved'),
			],
			writes,
		);

		const result = await importer.importProfiles([
			profile('ios', iosVersion),
			profile('android', androidVersion),
		]);

		expect(writes).toEqual([
			'catalog:android',
			'verified:android',
			'catalog:ios',
		]);
		expect(
			result.profiles.map(({ platform, status }) => ({ platform, status })),
		).toEqual([
			{ platform: 'android', status: 'supported' },
			{ platform: 'ios', status: 'schema-unresolved' },
		]);
		expect(result.releasePairs).toEqual([
			expect.objectContaining({ status: 'schema-unresolved', releaseId: null }),
		]);
	});

	test('builds and verifies every supported Android and iOS combination', async () => {
		const writes: string[] = [];
		const importer = createService(
			[
				imported('android', androidVersion, 'decoded'),
				imported('ios', iosVersion, 'decoded'),
			],
			writes,
		);

		const result = await importer.importProfiles([
			profile('android', androidVersion),
			profile('ios', iosVersion),
		]);

		expect(writes).toEqual([
			'catalog:android',
			'verified:android',
			'catalog:ios',
			'verified:ios',
			'candidate',
		]);
		expect(result.releasePairs[0]).toMatchObject({
			status: 'verified',
			releaseId: expect.stringMatching(/^[0-9a-f]{64}$/u),
		});
	});

	test('keeps a known candidate incompatibility distinct from a builder failure', async () => {
		const result = await createService(
			[
				imported('android', androidVersion, 'decoded'),
				imported('ios', iosVersion, 'decoded'),
			],
			[],
			new ReleaseCandidateCompatibilityError(
				{
					kind: 'platform-data-mismatch',
					tableLabel: 'carddatas.tsv',
				},
				['laterfeature.tsv'],
			),
		).importProfiles([
			profile('android', androidVersion),
			profile('ios', iosVersion),
		]);

		expect(result.releasePairs[0]).toMatchObject({
			status: 'platform-mismatch',
			compatibilityIssue: {
				kind: 'platform-data-mismatch',
				tableLabel: 'carddatas.tsv',
			},
			unavailableReadModelTables: ['laterfeature.tsv'],
		});
		expect(result.releasePairs[0]).not.toHaveProperty('errorMessage');
	});

	test('does not mark a built candidate runtime-ready when a read model is unavailable', async () => {
		const result = await createService(
			[
				imported('android', androidVersion, 'decoded'),
				imported('ios', iosVersion, 'decoded'),
			],
			[],
			undefined,
			['laterfeature.tsv'],
		).importProfiles([
			profile('android', androidVersion),
			profile('ios', iosVersion),
		]);

		expect(result.releasePairs[0]).toMatchObject({
			status: 'read-model-unresolved',
			unavailableReadModelTables: ['laterfeature.tsv'],
		});
	});

	test('keeps an absent platform catalog distinct from schema failures', async () => {
		const result = await createService([], []).importProfiles([
			profile('android', androidVersion, missingCatalog),
			profile('ios', iosVersion, missingCatalog),
		]);

		expect(result.profiles.map((entry) => entry.status)).toEqual([
			'input-missing',
			'input-missing',
		]);
		expect(result.releasePairs[0]?.status).toBe('input-missing');
	});

	test('continues after a saved catalog cannot be parsed', async () => {
		const brokenCatalog: MasterResourceCatalog = {
			readMasterEntries: async () => {
				throw new Error('catalog is corrupt');
			},
		};
		const result = await createService(
			[imported('ios', iosVersion, 'schema-unresolved')],
			[],
		).importProfiles([
			profile('android', androidVersion, brokenCatalog),
			profile('ios', iosVersion),
		]);

		expect(result.profiles).toEqual([
			expect.objectContaining({
				platform: 'android',
				status: 'import-failed',
				errorMessage: 'catalog is corrupt',
			}),
			expect.objectContaining({
				platform: 'ios',
				status: 'schema-unresolved',
			}),
		]);
	});
});

function createService(
	results: MasterResourceImportResult[],
	writes: string[],
	candidateError?: Error,
	unavailableReadModelTables: readonly string[] = [],
): SavedMasterVersionsImportService {
	return new SavedMasterVersionsImportService({
		createImporter: () => ({
			importEntries: async (entries: readonly unknown[]) => {
				const platform = (
					entries[0] as { platform: MasterArchivePlatform } | undefined
				)?.platform;
				return results.filter((result) => result.entry.platform === platform);
			},
		}),
		manifestStore: {
			writeCatalog: async (manifest) => {
				writes.push(`catalog:${manifest.platform}`);
			},
			writeVerified: async (manifest) => {
				writes.push(`verified:${manifest.platform}`);
			},
		},
		candidateValidator: {
			buildAndVerify: async () => {
				writes.push('candidate');
				if (candidateError !== undefined) throw candidateError;
				return {
					unavailableReadModelTables,
					logicalDatabaseIdentity: 'a'.repeat(64),
				};
			},
		},
		progressReporter: { profileCompleted: () => {} },
	});
}
