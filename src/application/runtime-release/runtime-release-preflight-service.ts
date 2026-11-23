import type { Database } from 'bun:sqlite';
import { getActivityRecordAdminSummaryFromDatabase } from '../../master-data/activity-record-master.ts';
import { openSqliteActiveMasterRepository } from '../../master-data/sqlite-active-master-repository.ts';
import {
	type ResourceVersionPlatform,
	type ResourceVersionRegistry,
	readResourceVersionRegistry,
	resolveEffectiveResourceVersion,
} from '../../resource-versions.ts';
import { collectionMusicInfoList } from '../../v1/active-master-database/collection-responses.ts';

type RuntimeReleasePreflightInput = Readonly<{
	resourceVersionRegistryRoot: string;
	activeMasterDatabasePath: string;
	selectedMasterReleasePath: string;
	clientVersion: string;
	revision: string;
	expectations: RuntimeContentExpectations;
}>;

type RuntimeContentExpectations =
	| Readonly<{
			music: Readonly<{ musicId: number }>;
			story?: Readonly<{ advSeriesId: number; advDataId: number }>;
	  }>
	| Readonly<{
			music?: Readonly<{ musicId: number }>;
			story: Readonly<{ advSeriesId: number; advDataId: number }>;
	  }>;

type MasterContent = Readonly<{
	musicIds: readonly number[];
	stories: readonly Readonly<{
		advSeriesId: number;
		advDataIds: readonly number[];
	}>[];
}>;

type ActiveMaster<DatabaseType> = Readonly<{
	selection: Readonly<{
		releaseId: string;
		androidResourceVersion: string;
		iosResourceVersion: string;
		database: DatabaseType;
	}>;
	close: () => void;
}>;

export type RuntimeReleasePreflightDependencies<DatabaseType = unknown> =
	Readonly<{
		readResourceVersions: (
			resourceVersionRegistryRoot: string,
		) => ResourceVersionRegistry;
		openActiveMaster: (
			activeDatabasePath: string,
			selectedReleasePath: string,
		) => ActiveMaster<DatabaseType>;
		inspectMasterDatabase: (database: DatabaseType) => MasterContent;
	}>;

type RuntimeReleasePlatformResult = Readonly<{
	platform: ResourceVersionPlatform;
	resourceVersion: string;
	masterReleaseId: string;
}>;

type RuntimeReleasePreflightResult = Readonly<{
	platforms: readonly RuntimeReleasePlatformResult[];
	expectations: RuntimeContentExpectations;
}>;

const platforms: readonly ResourceVersionPlatform[] = ['android', 'ios'];

export function preflightRuntimeRelease<DatabaseType>(
	input: RuntimeReleasePreflightInput,
	dependencies: RuntimeReleasePreflightDependencies<DatabaseType>,
): RuntimeReleasePreflightResult {
	const resourceVersions = dependencies.readResourceVersions(
		input.resourceVersionRegistryRoot,
	);
	const selected = dependencies.openActiveMaster(
		input.activeMasterDatabasePath,
		input.selectedMasterReleasePath,
	);
	try {
		const platformResults = platforms.map((platform) => {
			const registeredResourceVersion = resolveEffectiveResourceVersion(
				platform,
				resourceVersions,
				undefined,
				input.clientVersion,
			);
			const activeResourceVersion =
				platform === 'android'
					? selected.selection.androidResourceVersion
					: selected.selection.iosResourceVersion;
			if (activeResourceVersion !== registeredResourceVersion) {
				throw new Error(
					`${platform} active resource version differs from registry: ${activeResourceVersion}`,
				);
			}
			if (!activeResourceVersion.startsWith(`${input.revision}@`)) {
				throw new Error(
					`${platform} resource version must use revision ${input.revision}: ${activeResourceVersion}`,
				);
			}
			return {
				platform,
				resourceVersion: activeResourceVersion,
				masterReleaseId: selected.selection.releaseId,
			};
		});
		assertMasterContent(
			dependencies.inspectMasterDatabase(selected.selection.database),
			input.expectations,
		);
		return { platforms: platformResults, expectations: input.expectations };
	} finally {
		selected.close();
	}
}

export function preflightConfiguredRuntimeRelease(
	input: RuntimeReleasePreflightInput,
	readRelease?: Parameters<typeof openSqliteActiveMasterRepository>[2],
): RuntimeReleasePreflightResult {
	return preflightRuntimeRelease(input, {
		readResourceVersions: readResourceVersionRegistry,
		openActiveMaster: (database, metadata) =>
			openSqliteActiveMasterRepository(database, metadata, readRelease),
		inspectMasterDatabase: inspectRuntimeMasterDatabase,
	});
}

function assertMasterContent(
	content: MasterContent,
	expectations: RuntimeContentExpectations,
): void {
	const music = expectations.music;
	if (music !== undefined && !content.musicIds.includes(music.musicId)) {
		throw new Error(`music is missing: ${music.musicId}`);
	}
	const story = expectations.story;
	if (story === undefined) return;
	const series = content.stories.find(
		(candidate) => candidate.advSeriesId === story.advSeriesId,
	);
	if (series === undefined) {
		throw new Error(`activity record series is missing: ${story.advSeriesId}`);
	}
	if (!series.advDataIds.includes(story.advDataId)) {
		throw new Error(`activity record data is missing: ${story.advDataId}`);
	}
}

function inspectRuntimeMasterDatabase(database: Database): MasterContent {
	return {
		musicIds: collectionMusicInfoList(database).map((music) => music.musics_id),
		stories: getActivityRecordAdminSummaryFromDatabase(database).map(
			(series) => ({
				advSeriesId: series.advSeriesId,
				advDataIds: series.advList.map((adv) => adv.advDataId),
			}),
		),
	};
}
