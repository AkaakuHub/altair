import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { SavedMasterVersionsImportPorts } from '../application/saved-master-versions-import-service.ts';
import {
	type ActiveDatabaseBuildPlan,
	createActiveDatabaseBuildPlan,
} from '../domain/active-database-build.ts';
import {
	type CandidateMasterRelease,
	createOfficialActiveMasterRelease,
	createOfficialProfileActiveMasterRelease,
} from '../domain/active-master-release.ts';
import type { ContentAddressedBlobStore } from '../domain/content-addressed-blob-store.ts';
import {
	decodeGenericMasterBinary,
	type GenericMasterTable,
} from '../domain/generic-master-binary.ts';
import type { MasterFieldNameRegistry } from '../domain/master-resource-import.ts';
import { createPlatformDatabaseBuildPlan } from '../domain/platform-database-build.ts';
import type { PlatformManifest } from '../domain/platform-manifest.ts';
import { ReleaseCandidateCompatibilityError } from '../domain/release-candidate-compatibility.ts';
import type { SavedReleaseDerivedSourceFactory } from './saved-release-derived-source-factory.ts';
import {
	OfficialMasterSourceAdapter,
	officialMasterFieldsByColumnName,
} from './source-adapters/official-master-source-adapter.ts';
import type {
	OfficialDecodedTable,
	OfficialReadModelDefinition,
} from './source-adapters/source-input.ts';
import {
	SqliteActiveDatabaseVerifier,
	SqliteActiveDatabaseWriter,
} from './sqlite-active-database.ts';

type CandidateValidator = SavedMasterVersionsImportPorts['candidateValidator'];
type MasterReleasePair = Parameters<CandidateValidator['buildAndVerify']>[0];

export class SavedReleaseCandidateValidator implements CandidateValidator {
	constructor(
		private readonly input: Readonly<{
			archiveRoot: string;
			blobStore: ContentAddressedBlobStore;
			fieldNameRegistry: MasterFieldNameRegistry;
			readModels: readonly OfficialReadModelDefinition[];
			derivedSourceFactory: SavedReleaseDerivedSourceFactory;
		}>,
	) {
		if (input.readModels.length === 0) {
			throw new Error('Official read model registry is empty');
		}
	}

	async buildAndVerify(pair: MasterReleasePair): Promise<
		Readonly<{
			unavailableReadModelTables: readonly string[];
			logicalDatabaseIdentity: string;
		}>
	> {
		const stagingRoot = join(this.input.archiveRoot, '.candidate-validation');
		await mkdir(stagingRoot, { recursive: true });
		const release = createOfficialActiveMasterRelease(pair);
		const directory = await mkdtemp(
			join(stagingRoot, `${release.releaseIdentity}-`),
		);
		try {
			return await this.buildCandidate(
				release,
				join(directory, 'candidate.sqlite'),
			);
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	}

	async buildCandidate(
		release: CandidateMasterRelease,
		candidatePath: string,
	): Promise<
		Readonly<{
			unavailableReadModelTables: readonly string[];
			logicalDatabaseIdentity: string;
		}>
	> {
		const { plan, unavailableReadModelTables } = await this.createPlan(release);
		await new SqliteActiveDatabaseWriter().writeCandidate(candidatePath, plan);
		await new SqliteActiveDatabaseVerifier().verifyCandidate(
			candidatePath,
			plan,
		);
		return {
			unavailableReadModelTables,
			logicalDatabaseIdentity: plan.logicalDatabaseIdentity,
		};
	}

	async buildPlatformCandidate(
		sources: Readonly<
			Record<
				'android' | 'ios',
				Readonly<{
					manifest: PlatformManifest;
					clientVersion: string;
					resourceVersion: string;
					loadPlan?: () => Promise<ActiveDatabaseBuildPlan>;
				}>
			>
		>,
		candidatePath: string,
	) {
		const build = async (source: typeof sources.android) =>
			source.loadPlan === undefined
				? await this.createPlan(
						createOfficialProfileActiveMasterRelease(source.manifest),
					)
				: { plan: await source.loadPlan(), unavailableReadModelTables: [] };
		const [android, ios] = await Promise.all([
			build(sources.android),
			build(sources.ios),
		]);
		const plan = createPlatformDatabaseBuildPlan({
			android: {
				...android,
				clientVersion: sources.android.clientVersion,
				resourceVersion: sources.android.resourceVersion,
			},
			ios: {
				...ios,
				clientVersion: sources.ios.clientVersion,
				resourceVersion: sources.ios.resourceVersion,
			},
		});
		await new SqliteActiveDatabaseWriter().writeCandidate(candidatePath, plan);
		await new SqliteActiveDatabaseVerifier().verifyCandidate(
			candidatePath,
			plan,
		);
		return {
			unavailableReadModelTables: [
				...new Set([
					...android.unavailableReadModelTables,
					...ios.unavailableReadModelTables,
				]),
			].sort(),
			logicalDatabaseIdentity: plan.logicalDatabaseIdentity,
		};
	}

	async createPlan(release: CandidateMasterRelease) {
		const {
			officialTables,
			derivedOfficialTables,
			unavailableReadModelTables,
		} = await this.loadOfficialTables(release);
		const sourceIdentity = release.releaseIdentity;
		const sourceSha256 = createHash('sha256')
			.update(JSON.stringify(release.sourceIdentity))
			.digest('hex');
		const mappedOfficialSource = await new OfficialMasterSourceAdapter({
			identity: sourceIdentity,
			sha256: sourceSha256,
			tables: officialTables,
			readModels: this.input.readModels,
		}).load();
		const source = {
			...mappedOfficialSource,
			schemaFingerprints: [
				...new Set(
					release.manifests
						.flatMap((manifest) => manifest.tables)
						.map((table) => table.schemaFingerprint),
				),
			].sort(),
		};
		const derivedSources = await this.input.derivedSourceFactory
			.load(derivedOfficialTables)
			.catch((error: unknown) => {
				if (error instanceof ReleaseCandidateCompatibilityError) {
					throw new ReleaseCandidateCompatibilityError(
						error.issue,
						unavailableReadModelTables,
					);
				}
				throw error;
			});
		if (derivedSources.length === 0) {
			throw new Error('Release candidate derived sources are empty');
		}
		const plan = createActiveDatabaseBuildPlan({
			releaseIdentity: release.releaseIdentity,
			builderIdentity: 'master-archive-builder-v1',
			sources: [
				source,
				...((await release.additionalSources?.()) ?? []),
				...derivedSources,
			],
		});
		return { plan, unavailableReadModelTables };
	}

	private async loadOfficialTables(release: CandidateMasterRelease): Promise<
		Readonly<{
			officialTables: readonly OfficialDecodedTable[];
			unavailableReadModelTables: readonly string[];
			derivedOfficialTables: readonly OfficialDecodedTable[];
		}>
	> {
		const definitions = new Map(
			this.input.readModels.map((definition) => [
				definition.tableLabel,
				definition,
			]),
		);
		if (definitions.size !== this.input.readModels.length) {
			throw new Error('Official read model table label is duplicated');
		}
		const sources = release.manifests.map((manifest) => ({
			tables: manifestTables(manifest),
			platform: manifest.platform,
		}));
		const decoded: OfficialDecodedTable[] = [];
		const derivedOfficialTables: OfficialDecodedTable[] = [];
		const unavailableReadModelTables: string[] = [];
		const labels = [...definitions.keys()].sort();
		for (const tableLabel of labels) {
			const present = sources.filter((source) =>
				source.tables.has(tableLabel),
			).length;
			if (present === 0) unavailableReadModelTables.push(tableLabel);
			else if (present !== sources.length)
				throw new ReleaseCandidateCompatibilityError(
					{ kind: 'platform-table-availability-mismatch', tableLabel },
					unavailableReadModelTables,
				);
		}
		for (const tableLabel of labels) {
			if (unavailableReadModelTables.includes(tableLabel)) continue;
			const cache = new Map<string, GenericMasterTable>();
			const tables: OfficialDecodedTable[] = [];
			for (const source of sources) {
				const entry = source.tables.get(tableLabel);
				if (entry === undefined)
					throw new Error(
						'Master table availability changed during validation',
					);
				const base =
					cache.get(entry.blobSha256) ??
					(await this.decodeTable(tableLabel, entry.blobSha256));
				cache.set(entry.blobSha256, base);
				const table =
					release.mapTable?.(source.platform, {
						tableLabel,
						blobSha256: entry.blobSha256,
						schemaFingerprint: entry.schemaFingerprint,
						table: base,
					}) ?? base;
				tables.push({
					tableLabel,
					blobSha256: entry.blobSha256,
					schemaFingerprint: entry.schemaFingerprint,
					table,
				});
			}
			const primary = tables[0];
			if (primary === undefined)
				throw new Error('Master release has no source');
			if (
				tables.some(
					(entry) =>
						!isDeepStrictEqual(
							logicalTable(primary.table),
							logicalTable(entry.table),
						),
				)
			) {
				throw new ReleaseCandidateCompatibilityError(
					{ kind: 'platform-data-mismatch', tableLabel },
					unavailableReadModelTables,
				);
			}
			const officialTable = {
				...primary,
				blobSha256:
					release.mapTable !== undefined
						? createHash('sha256')
								.update(JSON.stringify(logicalTable(primary.table)))
								.digest('hex')
						: primary.blobSha256,
			};
			derivedOfficialTables.push(officialTable);
			const definition = definitions.get(tableLabel);
			if (definition === undefined)
				throw new Error('Master read model definition is absent');
			const fields = officialMasterFieldsByColumnName(primary.table);
			if (
				definition.columns.some(
					(column) =>
						column.source === 'field' && !fields.has(column.columnName),
				)
			) {
				unavailableReadModelTables.push(tableLabel);
				continue;
			}
			decoded.push(officialTable);
		}
		return {
			officialTables: decoded,
			derivedOfficialTables,
			unavailableReadModelTables,
		};
	}

	private async decodeTable(tableLabel: string, blobSha256: string) {
		const bytes = await this.input.blobStore.read(blobSha256);
		if (bytes === null) {
			throw new Error(`Release pair master blob is missing: ${tableLabel}`);
		}
		const table = decodeGenericMasterBinary(tableLabel, bytes, (input) =>
			this.input.fieldNameRegistry.resolve(input),
		).table;
		if (table.fields.some((field) => field.officialFieldName === null)) {
			throw new Error(`Release pair schema is unresolved: ${tableLabel}`);
		}
		return table;
	}
}

function manifestTables(manifest: PlatformManifest) {
	return new Map(manifest.tables.map((table) => [table.label, table]));
}

function logicalTable(table: GenericMasterTable) {
	return {
		fields: table.fields.map((field) => ({
			officialFieldName: field.officialFieldName,
			typeName: field.typeName,
		})),
		rows: table.rows.map((row) => row.cells),
	};
}
