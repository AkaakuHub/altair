import type { Database } from 'bun:sqlite';
import { dirname, join } from 'node:path';
import type { Hono } from 'hono';
import { registerGameApiDocumentation } from '../apiDocumentation/routes.ts';
import type { MissionProgressController } from '../application/mission-progress-controller-types.ts';
import type { UserStatusController } from '../application/user-status-controller.ts';
import { createAssetUrlRewriteMiddleware } from '../asset-url-rewrite.ts';
import type { ServerRuntimeConfig } from '../config.ts';
import type { ActiveMasterSelection } from '../master-data/active-master-repository.ts';
import { createRequestLogMiddleware } from '../request-log.ts';
import type { ResourceVersionRegistry } from '../resource-versions.ts';
import { resolveResponseResourceVersion } from '../resource-versions.ts';
import type { ServerState } from '../server-state-schema.ts';
import { createArchiveCommentRoutes } from '../v1/archive-comment-routes.ts';
import type { CommentsRepositoryProvider } from '../v1/comments-repository-provider.ts';
import { createMaintenanceModeMiddleware } from '../v1/route-support/maintenance-response.ts';
import { resolveRequestMasterDatabase } from '../v1/route-support/request-master-database.ts';
import { resolveRequestUser } from '../v1/route-support/request-user.ts';
import {
	createStateRoutes,
	type StateRouteExtensions,
} from '../v1/state-routes.ts';
import type { MasterSelectionResolvers } from './master-selection-resolvers.ts';

export type AppRouteWiring = {
	runtimeConfig: ServerRuntimeConfig;
	state: ServerState;
	activeMaster: ActiveMasterSelection;
	masterResolvers: MasterSelectionResolvers;
	resourceVersions: ResourceVersionRegistry;
	getUserStatusController: (database: Database) => UserStatusController;
	getMissionProgressController: (
		masterReleaseId: string,
		database: Database,
	) => MissionProgressController;
	getCommentsRepository: CommentsRepositoryProvider;
};

export function wireAppRoutes(
	app: Hono,
	dependencies: AppRouteWiring,
	registerExtensions?: (
		app: Hono,
		dependencies: AppRouteWiring,
	) => StateRouteExtensions | void,
): void {
	const {
		runtimeConfig,
		state,
		activeMaster,
		masterResolvers,
		resourceVersions,
		getUserStatusController,
		getMissionProgressController,
		getCommentsRepository,
	} = dependencies;

	if (runtimeConfig.requestLogEnabled) {
		app.use(
			'*',
			createRequestLogMiddleware({
				sqlitePath: runtimeConfig.requestLogDbPath,
			}),
		);
	}
	app.use('*', createAssetUrlRewriteMiddleware(runtimeConfig.assetBaseUrl));

	app.get('/health', (c) =>
		c.json({
			ok: true,
			service: 'altair',
			role: 'api',
			assetBaseUrl: runtimeConfig.assetBaseUrl ?? null,
		}),
	);

	registerGameApiDocumentation(app);
	const extensions = registerExtensions?.(app, dependencies);

	app.use(
		'/v1/*',
		createMaintenanceModeMiddleware(
			runtimeConfig.resourceVersionRegistryRoot,
			state,
			join(
				dirname(runtimeConfig.activeMasterDatabasePath),
				'runtime/maintenance.json',
			),
		),
	);

	app.route(
		'/',
		createStateRoutes(
			runtimeConfig,
			state,
			{
				resolveMasterReleaseDatabase: masterResolvers.resolveActiveRelease,
				resolveRequestMasterRelease: (c, user) =>
					resolveRequestMasterDatabase(c, user, activeMaster),
				resolveMissionProgress: (c, user) => {
					const selection = resolveRequestMasterDatabase(c, user, activeMaster);
					return getMissionProgressController(
						selection.masterReleaseId,
						selection.database,
					);
				},
				resolveUserStatus: (c, user) => {
					const database = resolveRequestMasterDatabase(
						c,
						user,
						activeMaster,
					).database;
					return getUserStatusController(database);
				},
				getCommentsRepository,
			},
			extensions ?? undefined,
		),
	);
	app.route(
		'/',
		createArchiveCommentRoutes(getCommentsRepository, (headers) => {
			const user = resolveRequestUser(headers, state);
			return resolveResponseResourceVersion(
				headers,
				user?.platformType,
				resourceVersions,
				state.resourceVersionOverrides,
			);
		}),
	);

	app.notFound((c) =>
		c.json(
			{
				error: 'not_found',
				path: new URL(c.req.url).pathname,
			},
			404,
		),
	);
}
