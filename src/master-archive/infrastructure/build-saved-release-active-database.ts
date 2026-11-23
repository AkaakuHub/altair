import { join } from 'node:path';
import { SavedReleaseActiveDatabaseBuildService } from 'altair/master-archive/application/saved-release-active-database-build-service';
import { composeSavedReleaseCandidateValidator } from 'altair/master-archive/infrastructure/compose-saved-release-candidate-validator';
import { NodeContentAddressedBlobStore } from 'altair/master-archive/infrastructure/node-master-archive-stores';
import { NodeSavedJsonDocumentReader } from 'altair/master-archive/infrastructure/node-saved-json-document-reader';
import {
	locateSavedDerivedSources,
	resolveMasterArchiveRoot,
} from 'altair/master-archive/infrastructure/saved-master-source-locator';
import { OFFICIAL_READ_MODEL_DEFINITIONS } from 'altair/master-archive/infrastructure/source-adapters/static-official-read-model-definitions';
import { STATIC_MASTER_FIELD_NAME_REGISTRY } from 'altair/master-archive/infrastructure/static-master-schema-field-sources';

import type { ArchiveSourceExtension } from './source-adapters/source-input.ts';

export async function buildSavedReleaseActiveDatabase(
	input: Parameters<SavedReleaseActiveDatabaseBuildService['build']>[0],
	environment: NodeJS.ProcessEnv = process.env,
	archiveExtension?: ArchiveSourceExtension,
) {
	const archiveRoot = resolveMasterArchiveRoot(environment);
	const blobStore = new NodeContentAddressedBlobStore(
		join(archiveRoot, 'blobs'),
	);
	const candidateBuilder = await composeSavedReleaseCandidateValidator({
		archiveRoot,
		blobStore,
		fieldNameRegistry: STATIC_MASTER_FIELD_NAME_REGISTRY,
		readModels: OFFICIAL_READ_MODEL_DEFINITIONS,
		derivedSources: await locateSavedDerivedSources(environment),
		documentReader: new NodeSavedJsonDocumentReader(),
		...(archiveExtension === undefined ? {} : { archiveExtension }),
	});
	const service = new SavedReleaseActiveDatabaseBuildService({
		manifestReader: {
			read: async (path) => await Bun.file(path).json(),
		},
		candidateBuilder,
	});
	return service.build(input);
}
