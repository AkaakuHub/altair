import {
	catalogIdentity,
	createCatalogMasterManifest,
} from '../domain/catalog-master-manifest.ts';
import type {
	MasterResourceCatalog,
	MasterResourceCatalogEntry,
	MasterResourceImportResult,
} from '../domain/master-resource-import.ts';
import type { PlatformManifest } from '../domain/platform-manifest.ts';
import { parsePlatformManifest } from '../domain/platform-manifest.ts';
import {
	ReleaseCandidateCompatibilityError,
	releaseCandidateCompatibilityStatus,
} from '../domain/release-candidate-compatibility.ts';
import { createMasterReleasePair } from '../domain/release-pair.ts';
import {
	classifyImportedProfile,
	compareSavedMasterVersions,
	failedMasterVersionProfile,
	failedReleasePairStatus,
	groupSavedMasterVersions,
	inputMissingProfile,
	missingReleasePair,
	type SavedMasterReleasePairResult,
	type SavedMasterVersionIdentity,
	type SavedMasterVersionProfileResult,
	savedMasterProfileKey,
} from '../domain/saved-master-version-import.ts';

export type SavedMasterVersionProfile = SavedMasterVersionIdentity &
	Readonly<{
		catalogSourceSha256: string | null;
		catalog: MasterResourceCatalog | null;
	}>;

type MasterReleasePair = ReturnType<typeof createMasterReleasePair>;
type CatalogMasterManifest = ReturnType<typeof createCatalogMasterManifest>;

export type SavedMasterVersionsImportPorts = Readonly<{
	createImporter(catalog: MasterResourceCatalog): {
		importEntries(
			entries: readonly MasterResourceCatalogEntry[],
		): Promise<readonly MasterResourceImportResult[]>;
	};
	manifestStore: {
		writeCatalog(manifest: CatalogMasterManifest): Promise<void>;
		writeVerified(manifest: PlatformManifest): Promise<void>;
	};
	candidateValidator: {
		buildAndVerify(pair: MasterReleasePair): Promise<
			Readonly<{
				unavailableReadModelTables: readonly string[];
				logicalDatabaseIdentity: string;
			}>
		>;
	};
	progressReporter: {
		profileCompleted(
			completed: number,
			total: number,
			result: SavedMasterVersionProfileResult,
		): void;
	};
}>;

export class SavedMasterVersionsImportService {
	constructor(private readonly ports: SavedMasterVersionsImportPorts) {}

	async importProfiles(
		profiles: readonly SavedMasterVersionProfile[],
	): Promise<{
		profiles: readonly SavedMasterVersionProfileResult[];
		releasePairs: readonly SavedMasterReleasePairResult[];
	}> {
		const orderedProfiles = [...profiles].sort(compareSavedMasterVersions);
		const profileResults: SavedMasterVersionProfileResult[] = [];
		const verifiedManifests: PlatformManifest[] = [];
		for (const [index, profile] of orderedProfiles.entries()) {
			const imported = await this.importProfile(profile);
			profileResults.push(imported.result);
			if (imported.manifest !== null) verifiedManifests.push(imported.manifest);
			this.ports.progressReporter.profileCompleted(
				index + 1,
				orderedProfiles.length,
				imported.result,
			);
		}
		return {
			profiles: profileResults,
			releasePairs: await this.verifyReleasePairs(
				orderedProfiles,
				profileResults,
				verifiedManifests,
			),
		};
	}

	private async importProfile(profile: SavedMasterVersionProfile): Promise<{
		result: SavedMasterVersionProfileResult;
		manifest: PlatformManifest | null;
	}> {
		if (profile.catalog === null) {
			return {
				result: inputMissingProfile(profile),
				manifest: null,
			};
		}
		if (profile.catalogSourceSha256 === null) {
			return {
				result: failedMasterVersionProfile(
					profile,
					'catalog source SHA-256 is missing',
				),
				manifest: null,
			};
		}
		let entries: readonly MasterResourceCatalogEntry[];
		try {
			entries = await profile.catalog.readMasterEntries();
		} catch (error) {
			return {
				result: failedMasterVersionProfile(profile, error),
				manifest: null,
			};
		}
		const identitySha256 = catalogIdentity({
			platform: profile.platform,
			clientVersion: profile.clientVersion,
			resourceVersion: profile.resourceVersion,
			sourceSha256: profile.catalogSourceSha256,
		});
		try {
			await this.ports.manifestStore.writeCatalog(
				createCatalogMasterManifest({
					clientVersion: profile.clientVersion,
					resourceVersion: profile.resourceVersion,
					catalogIdentitySha256: identitySha256,
					catalogSourceSha256: profile.catalogSourceSha256,
					entries,
				}),
			);
		} catch (error) {
			return {
				result: failedMasterVersionProfile(profile, error),
				manifest: null,
			};
		}
		let results: readonly MasterResourceImportResult[];
		try {
			results = await this.ports
				.createImporter(profile.catalog)
				.importEntries(entries);
		} catch (error) {
			return {
				result: failedMasterVersionProfile(profile, error),
				manifest: null,
			};
		}
		const result = classifyImportedProfile(profile, results);
		if (result.status !== 'supported') return { result, manifest: null };
		try {
			const manifest = parsePlatformManifest({
				schemaVersion: 1,
				platform: profile.platform,
				clientVersion: profile.clientVersion,
				resourceVersion: profile.resourceVersion,
				catalog: {
					identitySha256,
					sourceSha256: profile.catalogSourceSha256,
				},
				tables: results.map((entry) => ({
					label: entry.entry.tableLabel,
					catalogResourceIdentity: entry.entry.catalogResourceIdentity,
					encryptedResourceSha256: required(entry.encryptedSha256),
					blobSha256: required(entry.blobSha256),
					schemaFingerprint: required(entry.schemaFingerprint),
					rowCount: required(entry.rowCount),
					status: 'verified',
				})),
			});
			await this.ports.manifestStore.writeVerified(manifest);
			return { result, manifest };
		} catch (error) {
			return {
				result: failedMasterVersionProfile(profile, error),
				manifest: null,
			};
		}
	}

	private async verifyReleasePairs(
		profiles: readonly SavedMasterVersionProfile[],
		profileResults: readonly SavedMasterVersionProfileResult[],
		manifests: readonly PlatformManifest[],
	): Promise<readonly SavedMasterReleasePairResult[]> {
		const resultsByKey = new Map(
			profileResults.map((result) => [savedMasterProfileKey(result), result]),
		);
		const manifestByKey = new Map(
			manifests.map((manifest) => [savedMasterProfileKey(manifest), manifest]),
		);
		const groups = groupSavedMasterVersions(profiles);
		const pairResults: SavedMasterReleasePairResult[] = [];
		for (const group of groups) {
			if (group.android.length === 0 || group.ios.length === 0) {
				pairResults.push(missingReleasePair(group));
				continue;
			}
			for (const android of group.android) {
				for (const ios of group.ios) {
					const androidResult = required(
						resultsByKey.get(savedMasterProfileKey(android)),
					);
					const iosResult = required(
						resultsByKey.get(savedMasterProfileKey(ios)),
					);
					if (
						androidResult.status !== 'supported' ||
						iosResult.status !== 'supported'
					) {
						pairResults.push({
							clientVersion: group.clientVersion,
							resourceRevision: group.resourceRevision,
							androidResourceVersion: android.resourceVersion,
							iosResourceVersion: ios.resourceVersion,
							status: failedReleasePairStatus(androidResult, iosResult),
							releaseId: null,
						});
						continue;
					}
					let releaseId: string | null = null;
					try {
						const pair = createMasterReleasePair([
							required(manifestByKey.get(savedMasterProfileKey(android))),
							required(manifestByKey.get(savedMasterProfileKey(ios))),
						]);
						releaseId = pair.releaseId;
						const validation =
							await this.ports.candidateValidator.buildAndVerify(pair);
						if (validation.unavailableReadModelTables.length > 0) {
							pairResults.push({
								clientVersion: group.clientVersion,
								resourceRevision: group.resourceRevision,
								androidResourceVersion: android.resourceVersion,
								iosResourceVersion: ios.resourceVersion,
								status: 'read-model-unresolved',
								releaseId,
								unavailableReadModelTables:
									validation.unavailableReadModelTables,
							});
							continue;
						}
						pairResults.push({
							clientVersion: group.clientVersion,
							resourceRevision: group.resourceRevision,
							androidResourceVersion: android.resourceVersion,
							iosResourceVersion: ios.resourceVersion,
							status: 'verified',
							releaseId,
						});
					} catch (error) {
						if (error instanceof ReleaseCandidateCompatibilityError) {
							pairResults.push({
								clientVersion: group.clientVersion,
								resourceRevision: group.resourceRevision,
								androidResourceVersion: android.resourceVersion,
								iosResourceVersion: ios.resourceVersion,
								status: releaseCandidateCompatibilityStatus(error.issue),
								releaseId,
								compatibilityIssue: error.issue,
								...(error.unavailableReadModelTables.length > 0
									? {
											unavailableReadModelTables:
												error.unavailableReadModelTables,
										}
									: {}),
							});
							continue;
						}
						pairResults.push({
							clientVersion: group.clientVersion,
							resourceRevision: group.resourceRevision,
							androidResourceVersion: android.resourceVersion,
							iosResourceVersion: ios.resourceVersion,
							status: 'build-failed',
							releaseId,
							errorMessage:
								error instanceof Error ? error.message : String(error),
						});
					}
				}
			}
		}
		return pairResults;
	}
}

function required<Value>(value: Value | null | undefined): Value {
	if (value === null || value === undefined) {
		throw new Error('Saved master import result is incomplete');
	}
	return value;
}
