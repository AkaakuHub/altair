import type {
	MasterArchivePlatform,
	MasterResourceImportResult,
} from './master-resource-import.ts';
import type { ReleaseCandidateCompatibilityIssue } from './release-candidate-compatibility.ts';
import { resourceVersionRevision } from './resource-version.ts';

export type SavedMasterVersionIdentity = Readonly<{
	platform: MasterArchivePlatform;
	clientVersion: string;
	resourceVersion: string;
}>;

export type SavedMasterVersionProfileResult = SavedMasterVersionIdentity &
	Readonly<{
		status:
			| 'supported'
			| 'input-missing'
			| 'schema-unresolved'
			| 'import-failed';
		tableCount: number;
		storedBlobCount: number;
		existingBlobReferenceCount: number;
		schemaUnresolvedLabels: readonly string[];
		failedLabels: readonly string[];
		errorMessage?: string;
	}>;

export type SavedMasterReleasePairResult = Readonly<{
	clientVersion: string;
	resourceRevision: string;
	androidResourceVersion: string | null;
	iosResourceVersion: string | null;
	status:
		| 'verified'
		| 'input-missing'
		| 'schema-unresolved'
		| 'read-model-unresolved'
		| 'platform-mismatch'
		| 'derived-source-incompatible'
		| 'build-failed';
	releaseId: string | null;
	unavailableReadModelTables?: readonly string[];
	compatibilityIssue?: ReleaseCandidateCompatibilityIssue;
	errorMessage?: string;
}>;

type SavedMasterVersionGroup = Readonly<{
	clientVersion: string;
	resourceRevision: string;
	android: readonly SavedMasterVersionIdentity[];
	ios: readonly SavedMasterVersionIdentity[];
}>;

export function classifyImportedProfile(
	profile: SavedMasterVersionIdentity,
	results: readonly MasterResourceImportResult[],
): SavedMasterVersionProfileResult {
	const schemaUnresolvedLabels = results
		.filter((result) => result.status === 'schema-unresolved')
		.map((result) => result.entry.tableLabel)
		.sort();
	const failedLabels = results
		.filter(
			(result) =>
				result.status !== 'decoded' && result.status !== 'schema-unresolved',
		)
		.map((result) => result.entry.tableLabel)
		.sort();
	const status =
		failedLabels.length > 0
			? 'import-failed'
			: schemaUnresolvedLabels.length > 0
				? 'schema-unresolved'
				: 'supported';
	return {
		...profile,
		status,
		tableCount: results.length,
		storedBlobCount: results.filter(
			(result) => result.blobWriteResult === 'stored',
		).length,
		existingBlobReferenceCount: results.filter(
			(result) => result.blobWriteResult === 'already-present',
		).length,
		schemaUnresolvedLabels,
		failedLabels,
	};
}

export function inputMissingProfile(
	profile: SavedMasterVersionIdentity,
): SavedMasterVersionProfileResult {
	return {
		...profile,
		status: 'input-missing',
		tableCount: 0,
		storedBlobCount: 0,
		existingBlobReferenceCount: 0,
		schemaUnresolvedLabels: [],
		failedLabels: [],
	};
}

export function failedMasterVersionProfile(
	profile: SavedMasterVersionIdentity,
	error: unknown,
): SavedMasterVersionProfileResult {
	return {
		...profile,
		status: 'import-failed',
		tableCount: 0,
		storedBlobCount: 0,
		existingBlobReferenceCount: 0,
		schemaUnresolvedLabels: [],
		failedLabels: [],
		errorMessage: error instanceof Error ? error.message : String(error),
	};
}

export function savedMasterProfileKey(
	profile: SavedMasterVersionIdentity,
): string {
	return `${profile.platform}\u0000${profile.clientVersion}\u0000${profile.resourceVersion}`;
}

export function groupSavedMasterVersions(
	profiles: readonly SavedMasterVersionIdentity[],
): readonly SavedMasterVersionGroup[] {
	const groups = new Map<
		string,
		{
			clientVersion: string;
			resourceRevision: string;
			android: SavedMasterVersionIdentity[];
			ios: SavedMasterVersionIdentity[];
		}
	>();
	for (const profile of profiles) {
		const revision = resourceVersionRevision(profile.resourceVersion);
		const key = `${profile.clientVersion}\u0000${revision}`;
		const group = groups.get(key) ?? {
			clientVersion: profile.clientVersion,
			resourceRevision: revision,
			android: [],
			ios: [],
		};
		group[profile.platform].push(profile);
		groups.set(key, group);
	}
	return [...groups.values()].sort((left, right) =>
		`${left.clientVersion}\u0000${left.resourceRevision}`.localeCompare(
			`${right.clientVersion}\u0000${right.resourceRevision}`,
		),
	);
}

export function missingReleasePair(
	group: SavedMasterVersionGroup,
): SavedMasterReleasePairResult {
	return {
		clientVersion: group.clientVersion,
		resourceRevision: group.resourceRevision,
		androidResourceVersion: group.android[0]?.resourceVersion ?? null,
		iosResourceVersion: group.ios[0]?.resourceVersion ?? null,
		status: 'input-missing',
		releaseId: null,
	};
}

export function failedReleasePairStatus(
	android: SavedMasterVersionProfileResult,
	ios: SavedMasterVersionProfileResult,
): 'input-missing' | 'schema-unresolved' | 'build-failed' {
	if (android.status === 'input-missing' || ios.status === 'input-missing') {
		return 'input-missing';
	}
	if (
		android.status === 'schema-unresolved' ||
		ios.status === 'schema-unresolved'
	) {
		return 'schema-unresolved';
	}
	return 'build-failed';
}

export function compareSavedMasterVersions(
	left: SavedMasterVersionIdentity,
	right: SavedMasterVersionIdentity,
): number {
	return savedMasterProfileKey(left).localeCompare(
		savedMasterProfileKey(right),
	);
}
