import type { Database } from 'bun:sqlite';
import { Hono } from 'hono';
import type { ServerConfig, ServerRuntimeConfig } from './config.ts';
import { getGachaSeriesAdminSummaryFromDatabase } from './master-data/gacha-series-master.ts';
import { getCurrentlyActiveLoginBonusIdsFromDatabase } from './master-data/login-bonus-master.ts';
import { openSqliteActiveMasterRepository } from './master-data/sqlite-active-master-repository.ts';
import { createMasterBackedMissionProgressController } from './mission-progress-controller.ts';
import {
	detectResourceVersionPlatform,
	readResourceVersionRegistry,
} from './resource-versions.ts';
import {
	type AppRouteWiring,
	wireAppRoutes,
} from './server-composition/app-route-wiring.ts';
import {
	createKeyedControllerProvider,
	createWeakControllerProvider,
} from './server-composition/controller-providers.ts';
import { createMasterSelectionResolvers } from './server-composition/master-selection-resolvers.ts';
import { getServerRuntimeDefaultsFromDatabase } from './server-runtime-defaults.ts';
import { createServerState } from './server-state.ts';
import { createSqliteServerStateStore } from './sqlite-server-state-store.ts';
import { createMasterBackedUserStatusController } from './user-status-controller.ts';
import { createCommentsRepositoryProvider } from './v1/comments-repository-provider.ts';
import type { StateRouteExtensions } from './v1/state-routes.ts';

export function createApp(
	config: ServerConfig,
	registerExtensions?: (
		app: Hono,
		dependencies: AppRouteWiring,
	) => StateRouteExtensions | void,
): Hono {
	const runtimeConfigBase = {
		...config,
		stateStore:
			config.stateStore ?? createSqliteServerStateStore(config.stateDbPath),
	};
	const app = new Hono();
	const activeMasterRepository =
		config.activeMasterRepository ??
		openSqliteActiveMasterRepository(
			config.activeMasterDatabasePath,
			config.selectedMasterReleasePath,
		);
	const activeMaster = activeMasterRepository.selection;
	const resourceVersions = readResourceVersionRegistry(
		runtimeConfigBase.resourceVersionRegistryRoot,
	);
	const initialMasterDatabase = activeMaster.database;
	const runtimeConfig: ServerRuntimeConfig = {
		...runtimeConfigBase,
		activeLoginBonusIds:
			config.activeLoginBonusIds ??
			getCurrentlyActiveLoginBonusIdsFromDatabase(initialMasterDatabase),
	};
	const getUserStatusController = createWeakControllerProvider(
		createMasterBackedUserStatusController,
	);
	const getMissionProgressController = createKeyedControllerProvider(
		(
			masterReleaseId: string,
			database: Parameters<
				typeof createMasterBackedMissionProgressController
			>[1],
		) =>
			createMasterBackedMissionProgressController(
				state,
				database,
				masterReleaseId,
			),
	);
	const state = createServerState(
		runtimeConfig.stateStore,
		runtimeConfig.activeLoginBonusIds,
		getActiveGachaSeriesIds(initialMasterDatabase),
		() => getServerRuntimeDefaultsFromDatabase(initialMasterDatabase),
		() => getUserStatusController(initialMasterDatabase),
	);
	const masterResolvers = createMasterSelectionResolvers(
		activeMaster,
		(playerId) => {
			const user = state.registeredUsers.find(
				(entry) => entry.playerId === (playerId ?? state.selectedAdminPlayerId),
			);
			return detectResourceVersionPlatform(new Headers(), user?.platformType);
		},
	);
	state.resourceVersionOverrides = {
		android: activeMaster.androidResourceVersion,
		ios: activeMaster.iosResourceVersion,
	};
	const getCommentsRepository = createCommentsRepositoryProvider(
		runtimeConfig.commentsDb,
	);

	wireAppRoutes(
		app,
		{
			runtimeConfig,
			state,
			activeMaster,
			masterResolvers,
			resourceVersions,
			getUserStatusController,
			getMissionProgressController,
			getCommentsRepository,
		},
		registerExtensions,
	);

	return app;
}

function getActiveGachaSeriesIds(database: Database): number[] {
	return getGachaSeriesAdminSummaryFromDatabase(database)
		.filter((series) => series.isCurrentlyOpen)
		.map((series) => series.gachaSeriesId);
}
