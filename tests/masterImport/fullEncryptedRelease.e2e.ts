import { expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { absolutePathSchema } from '../../src/configuration/environment.ts';
import { MasterResourceImportService } from '../../src/master-archive/application/master-resource-import-service.ts';
import { SavedMasterVersionsImportService } from '../../src/master-archive/application/saved-master-versions-import-service.ts';
import { createOfficialActiveMasterRelease } from '../../src/master-archive/domain/active-master-release.ts';
import { createMasterReleasePair } from '../../src/master-archive/domain/release-pair.ts';
import { completeResourceVersionSchema } from '../../src/master-archive/domain/resource-version.ts';
import { AndroidMasterCatalogAdapter } from '../../src/master-archive/infrastructure/android-master-catalog-adapter.ts';
import { composeSavedReleaseCandidateValidator } from '../../src/master-archive/infrastructure/compose-saved-release-candidate-validator.ts';
import { createMasterResourcePayloadReader } from '../../src/master-archive/infrastructure/create-master-resource-payload-reader.ts';
import { IosMasterCatalogAdapter } from '../../src/master-archive/infrastructure/ios-master-catalog-adapter.ts';
import {
	NodeContentAddressedBlobStore,
	NodeMasterBlobReferenceStore,
	NodeMasterDecodeReportStore,
} from '../../src/master-archive/infrastructure/node-master-archive-stores.ts';
import {
	masterManifestPath,
	NodeMasterManifestStore,
} from '../../src/master-archive/infrastructure/node-master-manifest-store.ts';
import { NodeSavedJsonDocumentReader } from '../../src/master-archive/infrastructure/node-saved-json-document-reader.ts';
import {
	GzipInspixCatalogReader,
	SqliteSourceCatalogReader,
} from '../../src/master-archive/infrastructure/saved-catalog-readers.ts';
import {
	SavedMasterResourceDecryptor,
	SavedMasterResourceIntegrityVerifier,
} from '../../src/master-archive/infrastructure/saved-master-resource-adapters.ts';
import {
	fileSha256,
	locateSavedDerivedSources,
} from '../../src/master-archive/infrastructure/saved-master-source-locator.ts';
import { OFFICIAL_READ_MODEL_DEFINITIONS } from '../../src/master-archive/infrastructure/source-adapters/static-official-read-model-definitions.ts';
import { STATIC_MASTER_FIELD_NAME_REGISTRY } from '../../src/master-archive/infrastructure/static-master-schema-field-sources.ts';
import { externalFixturePath } from '../externalFixtures/sourcePath.ts';
import { verifyInitialRuntime } from './support/verifyInitialRuntime.ts';

const profileSchema = z
	.object({
		catalogPath: absolutePathSchema,
		clientVersion: z.string().min(1),
		resourceVersion: completeResourceVersionSchema,
	})
	.strict();
const inputsSchema = z
	.object({
		resourceRoot: absolutePathSchema,
		android: profileSchema,
		ios: profileSchema,
	})
	.strict();

test('両OSの暗号化resの取込から初期化・登録・初期カード取得まで完了する', async () => {
	const configuration = externalFixturePath('encrypted-bootstrap.json');
	const inputs = inputsSchema.parse(
		JSON.parse(await readFile(configuration, 'utf8')),
	);
	const directory = await mkdtemp(join(tmpdir(), 'encrypted-initial-release-'));
	try {
		const blobStore = new NodeContentAddressedBlobStore(
			join(directory, 'blobs'),
		);
		const blobReferenceStore = new NodeMasterBlobReferenceStore(
			join(directory, 'blob-references'),
		);
		const reportStore = new NodeMasterDecodeReportStore(
			join(directory, 'reports'),
		);
		const candidateValidator = await composeSavedReleaseCandidateValidator({
			archiveRoot: directory,
			blobStore,
			fieldNameRegistry: STATIC_MASTER_FIELD_NAME_REGISTRY,
			readModels: OFFICIAL_READ_MODEL_DEFINITIONS,
			derivedSources: await locateSavedDerivedSources({
				DATA_ROOT: directory,
			}),
			documentReader: new NodeSavedJsonDocumentReader(),
		});
		const payloadReader = createMasterResourcePayloadReader(
			pathToFileURL(inputs.resourceRoot + '/'),
		);
		const service = new SavedMasterVersionsImportService({
			createImporter: (catalog) =>
				new MasterResourceImportService({
					catalog,
					payloadReader,
					integrityVerifier: new SavedMasterResourceIntegrityVerifier(),
					decryptor: new SavedMasterResourceDecryptor(),
					fieldNameRegistry: STATIC_MASTER_FIELD_NAME_REGISTRY,
					blobStore,
					blobReferenceStore,
					reportStore,
				}),
			manifestStore: new NodeMasterManifestStore(directory),
			candidateValidator,
			progressReporter: { profileCompleted: () => undefined },
		});
		const profiles = await Promise.all(
			(['android', 'ios'] as const).map(async (platform) => {
				const input = inputs[platform];
				const catalogSourceSha256 = await fileSha256(input.catalogPath);
				const reader =
					platform === 'android'
						? new GzipInspixCatalogReader(
								input.catalogPath,
								catalogSourceSha256,
							)
						: new SqliteSourceCatalogReader(
								input.catalogPath,
								catalogSourceSha256,
							);
				const catalog =
					platform === 'android'
						? new AndroidMasterCatalogAdapter(reader, input.resourceVersion)
						: new IosMasterCatalogAdapter(reader, input.resourceVersion);
				return {
					platform,
					clientVersion: input.clientVersion,
					resourceVersion: input.resourceVersion,
					catalogSourceSha256,
					catalog,
				};
			}),
		);
		const imported = await service.importProfiles(profiles);
		expect(imported.profiles.map((profile) => profile.status)).toEqual([
			'supported',
			'supported',
		]);
		expect(imported.releasePairs).toHaveLength(1);
		expect(imported.releasePairs[0]?.status).toBe('verified');
		const paths = profiles.map((profile) =>
			masterManifestPath({
				archiveRoot: directory,
				directory: 'manifests',
				platform: profile.platform,
				resourceVersion: profile.resourceVersion,
			}),
		);
		const [androidManifestPath, iosManifestPath] = paths;
		if (androidManifestPath === undefined || iosManifestPath === undefined)
			throw new Error('Imported manifest is missing');
		const pair = createMasterReleasePair(
			await Promise.all(
				paths.map(async (path) => JSON.parse(await readFile(path, 'utf8'))),
			),
		);
		expect(pair.android.tables.length).toBeGreaterThan(0);
		expect(pair.ios.tables.length).toBe(pair.android.tables.length);
		const candidatePath = join(directory, 'candidate.sqlite');
		const result = await candidateValidator.buildCandidate(
			createOfficialActiveMasterRelease(pair),
			candidatePath,
		);
		expect(result.unavailableReadModelTables).toEqual([]);
		await verifyInitialRuntime({
			directory,
			candidatePath,
			androidManifestPath,
			iosManifestPath,
		});
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}, 300000);
