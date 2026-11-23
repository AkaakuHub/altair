import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import type { MissionProgressController } from '../../application/mission-progress-controller-types.ts';
import type { UserStatusController } from '../../application/user-status-controller.ts';
import type { ServerRuntimeConfig } from '../../config.ts';
import type { ResourceVersionRegistry } from '../../resource-versions.ts';
import {
	createRuntimeDateService,
	type RuntimeDateService,
} from '../../runtime-date.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import type { JsonObject } from '../../state/json-state-utils.ts';
import type { PresentBoxItem } from '../../state/user-presents-state.ts';
import type { StoredResponse } from '../active-master-database/types.ts';
import type { CommentsRepositoryProvider } from '../comments-repository-provider.ts';
import { createErrorResponse, createStoredResponse } from '../http/response.ts';
import { applyHeaders } from '../http/response-header-common.ts';
import type { RouteResponseHeaderContext } from '../http/response-header-context.ts';
import type { RouteErrorCode } from '../http/route-errors.ts';
import type { ArchiveHomeResponse } from '../responses/live-broadcast-home-response.ts';
import type { RequestMasterReleaseContext } from './request-master-database.ts';
import { createResponseHeaderContextFactory } from './response-header-context-factory.ts';
import { loadStateRouteFixtures } from './state-route-fixtures.ts';

export type StateRouteProjection = {
	projectArchiveHome?: (
		response: ArchiveHomeResponse,
		playerId: string,
	) => ArchiveHomeResponse;
	resolveGiftShopCharacters?: (
		kind: 'withlive' | 'feslive',
		liveId: string,
	) => ReadonlySet<number> | undefined;
	isPresentRestricted?: (present: PresentBoxItem) => boolean;
};

export type StateRouteContext = {
	config: ServerRuntimeConfig;
	state: ServerState;
	resourceVersions: ResourceVersionRegistry;
	defaultHeaders: ReadonlyArray<readonly [string, string]>;
	userLoginHeaders: ReadonlyArray<readonly [string, string]>;
	userCardGetList: JsonObject;
	userItemsGetList: JsonObject;
	respondStored: (
		c: Context,
		headers: ReadonlyArray<readonly [string, string]>,
		response: StoredResponse | undefined,
	) => Response;
	applyResponseHeaders: (
		c: Context,
		headers: ReadonlyArray<readonly [string, string]>,
		context?: RouteResponseHeaderContext,
	) => void;
	respondError: (
		c: Context,
		code: RouteErrorCode,
		context?: RouteResponseHeaderContext,
	) => Response;
	date: RuntimeDateService;
	resolveMissionProgress: (
		c: Context,
		user?: RegisteredUserState,
	) => MissionProgressController;
	resolveMasterDatabase: (c: Context, user?: RegisteredUserState) => Database;
	resolveRequestMasterRelease: (
		c: Context,
		user?: RegisteredUserState,
	) => RequestMasterReleaseContext;
	resolveMasterReleaseDatabase: (masterReleaseId: string) => Database;
	resolveUserStatus: (
		c: Context,
		user?: RegisteredUserState,
	) => UserStatusController;
	getCommentsRepository: CommentsRepositoryProvider;
} & StateRouteProjection;

export type StateRouteDependencies = {
	resolveMissionProgress: (
		c: Context,
		user?: RegisteredUserState,
	) => MissionProgressController;
	resolveRequestMasterRelease: (
		c: Context,
		user?: RegisteredUserState,
	) => RequestMasterReleaseContext;
	resolveMasterReleaseDatabase: (masterReleaseId: string) => Database;
	resolveUserStatus: (
		c: Context,
		user?: RegisteredUserState,
	) => UserStatusController;
	getCommentsRepository: CommentsRepositoryProvider;
};

export function createStateRouteContext(
	config: ServerRuntimeConfig,
	state: ServerState,
	dependencies: StateRouteDependencies,
	projection: StateRouteProjection = {},
): StateRouteContext {
	const fixtures = loadStateRouteFixtures(config);
	const context = {
		config,
		state,
		date: createRuntimeDateService(config),
		resolveMissionProgress: dependencies.resolveMissionProgress,
		resolveRequestMasterRelease: dependencies.resolveRequestMasterRelease,
		resolveMasterReleaseDatabase: dependencies.resolveMasterReleaseDatabase,
		resolveMasterDatabase: (c, user) =>
			dependencies.resolveRequestMasterRelease(c, user).database,
		resolveUserStatus: dependencies.resolveUserStatus,
		getCommentsRepository: dependencies.getCommentsRepository,
		...fixtures,
		...projection,
	} satisfies Omit<
		StateRouteContext,
		'applyResponseHeaders' | 'respondError' | 'respondStored'
	>;
	const createResponseHeaderContext = createResponseHeaderContextFactory({
		state,
		resolveRequestMasterRelease: dependencies.resolveRequestMasterRelease,
		resolveUserStatus: dependencies.resolveUserStatus,
	});

	return {
		...context,
		applyResponseHeaders: (c, headers, headerContext) =>
			applyHeaders(
				c,
				headers,
				state,
				fixtures.resourceVersions,
				createResponseHeaderContext(c, headerContext),
			),
		respondError: (c, code, headerContext) =>
			createErrorResponse(
				c,
				fixtures.defaultHeaders,
				state,
				fixtures.resourceVersions,
				code,
				createResponseHeaderContext(c, headerContext),
			),
		respondStored: (c, headers, response) =>
			createStoredResponse(
				c,
				headers === fixtures.defaultHeaders ? fixtures.defaultHeaders : headers,
				state,
				fixtures.resourceVersions,
				response,
				createResponseHeaderContext(c),
			),
	};
}
