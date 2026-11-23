import { mkdir, readFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { resolveRuntimeStorageLayout } from 'altair/configuration/runtime-storage-layout';
import { MasterResourceImportService } from 'altair/master-archive/application/master-resource-import-service';
import {
	type SavedMasterVersionProfile,
	SavedMasterVersionsImportService,
} from 'altair/master-archive/application/saved-master-versions-import-service';
import {
	mergeRuntimeReleaseIndexes,
	parseRuntimeReleaseIndex,
	type RuntimeReleaseIndex,
} from 'altair/master-archive/domain/runtime-release-index';
import { savedMasterProfileKey } from 'altair/master-archive/domain/saved-master-version-import';
import { AndroidMasterCatalogAdapter } from 'altair/master-archive/infrastructure/android-master-catalog-adapter';
import { composeSavedReleaseCandidateValidator } from 'altair/master-archive/infrastructure/compose-saved-release-candidate-validator';
import { createMasterResourcePayloadReader } from 'altair/master-archive/infrastructure/create-master-resource-payload-reader';
import { IosMasterCatalogAdapter } from 'altair/master-archive/infrastructure/ios-master-catalog-adapter';
import {
	NodeContentAddressedBlobStore,
	NodeMasterBlobReferenceStore,
	NodeMasterDecodeReportStore,
} from 'altair/master-archive/infrastructure/node-master-archive-stores';
import { NodeMasterManifestStore } from 'altair/master-archive/infrastructure/node-master-manifest-store';
import { NodeSavedCatalogIndexStore } from 'altair/master-archive/infrastructure/node-saved-catalog-index-store';
import { NodeSavedJsonDocumentReader } from 'altair/master-archive/infrastructure/node-saved-json-document-reader';
import {
	GzipInspixCatalogReader,
	SqliteSourceCatalogReader,
} from 'altair/master-archive/infrastructure/saved-catalog-readers';
import {
	SavedMasterResourceDecryptor,
	SavedMasterResourceIntegrityVerifier,
} from 'altair/master-archive/infrastructure/saved-master-resource-adapters';
import {
	fileSha256,
	locateSavedDerivedSources,
	savedCatalogProfiles,
} from 'altair/master-archive/infrastructure/saved-master-source-locator';
import { OFFICIAL_READ_MODEL_DEFINITIONS } from 'altair/master-archive/infrastructure/source-adapters/static-official-read-model-definitions';
import {
	STATIC_MASTER_FIELD_NAME_REGISTRY,
	STATIC_MASTER_SCHEMA_FIELD_IDENTITY,
} from 'altair/master-archive/infrastructure/static-master-schema-field-sources';
import { readResourceVersionRegistry } from 'altair/resource-versions';

import type { ArchiveSourceExtension } from './source-adapters/source-input.ts';

export async function importSavedMasterVersions(
	environment: NodeJS.ProcessEnv = process.env,
	options: {
		archiveExtension?: ArchiveSourceExtension;
		catalogRoot?: string;
	} = {},
) {
	const storage = resolveRuntimeStorageLayout(environment);
	const archiveRoot = storage.masterArchiveRoot;
	const { archiveExtension } = options;
	const derivedSources = await locateSavedDerivedSources(environment);
	const fieldNameRegistry = STATIC_MASTER_FIELD_NAME_REGISTRY;
	const blobStore = new NodeContentAddressedBlobStore(
		join(archiveRoot, 'blobs'),
	);
	const blobReferenceStore = new NodeMasterBlobReferenceStore(
		join(archiveRoot, 'resource-blob-references'),
	);
	const reportStore = new NodeMasterDecodeReportStore(
		join(archiveRoot, 'reports', 'decode', STATIC_MASTER_SCHEMA_FIELD_IDENTITY),
	);
	const assetBaseUrl = environment.ASSET_BASE_URL;
	if (assetBaseUrl === undefined) throw new Error('ASSET_BASE_URL is required');
	const payloadReader = createMasterResourcePayloadReader(
		new URL(assetBaseUrl),
	);
	const integrityVerifier = new SavedMasterResourceIntegrityVerifier();
	const decryptor = new SavedMasterResourceDecryptor();
	const candidateValidator = await composeSavedReleaseCandidateValidator({
		archiveRoot,
		blobStore,
		fieldNameRegistry,
		readModels: OFFICIAL_READ_MODEL_DEFINITIONS,
		derivedSources,
		documentReader: new NodeSavedJsonDocumentReader(),
		...(archiveExtension === undefined ? {} : { archiveExtension }),
	});
	const catalogIndexStore = new NodeSavedCatalogIndexStore(archiveRoot);

	const savedProfiles = await savedCatalogProfiles(
		readResourceVersionRegistry(storage.resourceVersionRegistryRoot),
		options.catalogRoot ?? storage.catalogRoot,
	);
	if (savedProfiles.length === 0) {
		throw new Error('Saved master catalog sources are empty');
	}
	const catalogSources = await Promise.all(
		savedProfiles.map(async (profile) => {
			const sourceSha256 = await fileSha256(profile.path);
			const sourceReader =
				profile.platform === 'android'
					? new GzipInspixCatalogReader(profile.path, sourceSha256)
					: new SqliteSourceCatalogReader(profile.path, sourceSha256);
			const catalog =
				profile.platform === 'android'
					? new AndroidMasterCatalogAdapter(
							sourceReader,
							profile.resourceVersion,
						)
					: new IosMasterCatalogAdapter(sourceReader, profile.resourceVersion);
			return {
				identity: profile,
				sourceReader,
				profile: {
					platform: profile.platform,
					clientVersion: profile.clientVersion,
					resourceVersion: profile.resourceVersion,
					catalogSourceSha256: sourceSha256,
					catalog,
				},
			};
		}),
	);
	const profiles: SavedMasterVersionProfile[] = catalogSources.map(
		(source) => source.profile,
	);
	const catalogSourcesByProfile = new Map(
		catalogSources.map((source) => [
			savedMasterProfileKey(source.identity),
			source,
		]),
	);

	const service = new SavedMasterVersionsImportService({
		createImporter: (catalog) =>
			new MasterResourceImportService({
				catalog,
				payloadReader,
				integrityVerifier,
				decryptor,
				fieldNameRegistry,
				blobStore,
				blobReferenceStore,
				reportStore,
			}),
		manifestStore: new NodeMasterManifestStore(archiveRoot),
		candidateValidator,
		progressReporter: {
			profileCompleted: (completed, total, result) => {
				process.stderr.write(
					`${completed}/${total} ${result.platform} ${result.resourceVersion} ${result.status}\n`,
				);
			},
		},
	});

	const result = await service.importProfiles(profiles);
	for (const profile of result.profiles) {
		if (profile.status !== 'supported') continue;
		const source = catalogSourcesByProfile.get(savedMasterProfileKey(profile));
		if (source === undefined) {
			throw new Error('Supported saved catalog source is missing');
		}
		await catalogIndexStore.write(
			source.identity,
			await source.sourceReader.read(),
		);
	}
	const releaseIndexAdditions: RuntimeReleaseIndex = {};
	for (const release of result.releasePairs) {
		if (release.status === 'verified' && release.releaseId !== null) {
			if (
				release.androidResourceVersion === null ||
				release.iosResourceVersion === null
			) {
				throw new Error('Saved master release pair is incomplete');
			}
			releaseIndexAdditions[release.releaseId] = {
				android: release.androidResourceVersion,
				ios: release.iosResourceVersion,
			};
		}
	}
	if (Object.keys(releaseIndexAdditions).length === 0) {
		throw new Error('Saved master release index is empty');
	}
	const releaseIndexPath = join(archiveRoot, 'releases', 'index.json');
	const releaseIndex = mergeRuntimeReleaseIndexes(
		await readRuntimeReleaseIndex(releaseIndexPath),
		parseRuntimeReleaseIndex(releaseIndexAdditions),
	);
	await writeJsonAtomically(releaseIndexPath, releaseIndex);
	const physicalBlobCount = Array.from(
		new Bun.Glob('blobs/*/*.bin').scanSync(archiveRoot),
	).length;
	const summary = {
		schemaVersion: 1,
		profiles: result.profiles,
		releasePairs: result.releasePairs,
		counts: {
			profiles: countBy(result.profiles, (entry) => entry.status),
			platforms: countBy(result.profiles, (entry) => entry.platform),
			releasePairs: countBy(result.releasePairs, (entry) => entry.status),
			physicalBlobCount,
			blobReferenceCount: result.profiles.reduce(
				(total, profile) =>
					total + profile.storedBlobCount + profile.existingBlobReferenceCount,
				0,
			),
		},
		schemaFieldIdentity: STATIC_MASTER_SCHEMA_FIELD_IDENTITY,
	};
	await writeJsonAtomically(
		join(archiveRoot, 'reports', 'import', 'latest.json'),
		summary,
	);
	return summary.counts;
}

function countBy<Value>(
	values: readonly Value[],
	keyOf: (value: Value) => string,
): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const value of values) {
		const key = keyOf(value);
		counts[key] = (counts[key] ?? 0) + 1;
	}
	return counts;
}

async function writeJsonAtomically(
	path: string,
	value: unknown,
): Promise<void> {
	const temporaryPath = `${path}.new`;
	await mkdir(dirname(path), { recursive: true });
	await Bun.write(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
	await rename(temporaryPath, path);
}

async function readRuntimeReleaseIndex(
	path: string,
): Promise<RuntimeReleaseIndex> {
	try {
		return parseRuntimeReleaseIndex(JSON.parse(await readFile(path, 'utf8')));
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return {};
		}
		throw error;
	}
}
