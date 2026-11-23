import { expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, normalize } from 'node:path';
import { z } from 'zod';
import { createOfficialActiveMasterRelease } from '../../src/master-archive/domain/active-master-release.ts';
import { createMasterReleasePair } from '../../src/master-archive/domain/release-pair.ts';
import { composeSavedReleaseCandidateValidator } from '../../src/master-archive/infrastructure/compose-saved-release-candidate-validator.ts';
import { NodeContentAddressedBlobStore } from '../../src/master-archive/infrastructure/node-master-archive-stores.ts';
import { NodeSavedJsonDocumentReader } from '../../src/master-archive/infrastructure/node-saved-json-document-reader.ts';
import { locateSavedDerivedSources } from '../../src/master-archive/infrastructure/saved-master-source-locator.ts';
import { OFFICIAL_READ_MODEL_DEFINITIONS } from '../../src/master-archive/infrastructure/source-adapters/static-official-read-model-definitions.ts';
import { STATIC_MASTER_FIELD_NAME_REGISTRY } from '../../src/master-archive/infrastructure/static-master-schema-field-sources.ts';
import { externalFixturePath } from '../externalFixtures/sourcePath.ts';
import { verifyInitialRuntime } from './support/verifyInitialRuntime.ts';

const absolutePath = z
	.string()
	.min(1)
	.refine((value) => isAbsolute(value) && normalize(value) === value);
const inputsSchema = z
	.object({
		androidManifestPath: absolutePath,
		iosManifestPath: absolutePath,
		blobRoot: absolutePath,
	})
	.strict();

test('外部の両OSマスターの全読取モデル構築からAPI起動まで完了する', async () => {
	const configuration = externalFixturePath('bootstrap.json');
	const inputs = inputsSchema.parse(
		JSON.parse(await readFile(configuration, 'utf8')),
	);
	const pair = createMasterReleasePair(
		await Promise.all(
			[inputs.androidManifestPath, inputs.iosManifestPath].map(async (path) =>
				JSON.parse(await readFile(path, 'utf8')),
			),
		),
	);
	const source = new NodeContentAddressedBlobStore(inputs.blobRoot);
	const directory = await mkdtemp(join(tmpdir(), 'full-saved-release-'));
	try {
		const candidatePath = join(directory, 'candidate.sqlite');
		const validator = await composeSavedReleaseCandidateValidator({
			archiveRoot: directory,
			blobStore: {
				contains: (sha256) => source.contains(sha256),
				read: (sha256) => source.read(sha256),
				write: async () => {
					throw new Error('Fixture blob store is read-only');
				},
			},
			fieldNameRegistry: STATIC_MASTER_FIELD_NAME_REGISTRY,
			readModels: OFFICIAL_READ_MODEL_DEFINITIONS,
			derivedSources: await locateSavedDerivedSources({
				DATA_ROOT: directory,
			}),
			documentReader: new NodeSavedJsonDocumentReader(),
		});
		const result = await validator.buildCandidate(
			createOfficialActiveMasterRelease(pair),
			candidatePath,
		);
		expect(result.unavailableReadModelTables).toEqual([]);
		await verifyInitialRuntime({
			directory,
			candidatePath,
			androidManifestPath: inputs.androidManifestPath,
			iosManifestPath: inputs.iosManifestPath,
		});
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}, 300_000);
