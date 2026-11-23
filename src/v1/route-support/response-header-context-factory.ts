import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import { projectCompatibleMusicProgresses } from '../../application/music-progress-projection.ts';
import type { UserStatusController } from '../../application/user-status-controller.ts';
import {
	getActiveChapterMasterFromDatabase,
	getChapterRankFromDatabase,
} from '../../master-data/chapter-master-data.ts';
import { getMusicIdentityFingerprints } from '../../master-data/entity-identity-fingerprints.ts';
import { getGachaSeriesAdminSummaryFromDatabase } from '../../master-data/gacha-series-master.ts';
import { getReceivableRhythmGameClassDataFromDatabase } from '../../master-data/rhythm-game-class-missions.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import type {
	ResponseHeaderContext,
	RouteResponseHeaderContext,
} from '../http/response-header-context.ts';
import { hasAvailablePetalExchangeFromDatabase } from './petal-exchange-notification-availability.ts';
import type { RequestMasterReleaseContext } from './request-master-database.ts';
import { resolveRequestUser } from './request-user.ts';
import { hasAvailableShopExchangeFromDatabase } from './shop-exchange-notification-availability.ts';
import { hasAvailableSiscaStorePurchaseFromDatabase } from './sisca-store-notification-availability.ts';

type ResponseHeaderContextDependencies = {
	state: Pick<ServerState, 'registeredUsers'>;
	resolveRequestMasterRelease: (
		c: Context,
		user?: RegisteredUserState,
	) => RequestMasterReleaseContext;
	resolveUserStatus: (
		c: Context,
		user?: RegisteredUserState,
	) => UserStatusController;
};

export function createResponseHeaderContextFactory(
	dependencies: ResponseHeaderContextDependencies,
): (
	c: Context,
	headerContext?: RouteResponseHeaderContext,
) => ResponseHeaderContext {
	return (c, headerContext = {}) => {
		const user =
			headerContext.user ??
			resolveRequestUser(c.req.raw.headers, dependencies.state);
		let database: Database | undefined;
		const getMasterDatabase = (): Database => {
			database ??= dependencies.resolveRequestMasterRelease(c, user).database;
			return database;
		};
		return {
			...headerContext,
			user,
			getUserStatusView: (serverState, requestUser) =>
				dependencies
					.resolveUserStatus(c, requestUser)
					.getView(serverState, requestUser),
			getActiveChapterMaster: (runtime) =>
				getActiveChapterMasterFromDatabase(getMasterDatabase(), runtime),
			getChapterRank: (currentPoint) =>
				getChapterRankFromDatabase(getMasterDatabase(), currentPoint),
			getGachaSeriesAdminSummary: () =>
				getGachaSeriesAdminSummaryFromDatabase(getMasterDatabase()),
			hasAvailablePetalExchange: (serverState, requestUser) =>
				hasAvailablePetalExchangeFromDatabase(
					getMasterDatabase(),
					serverState,
					requestUser,
				),
			hasAvailableShopExchange: (serverState, requestUser) =>
				hasAvailableShopExchangeFromDatabase(
					getMasterDatabase(),
					serverState,
					requestUser,
				),
			hasAvailableSiscaStorePurchase: (serverState, requestUser) =>
				hasAvailableSiscaStorePurchaseFromDatabase(
					getMasterDatabase(),
					serverState,
					requestUser,
				),
			getReceivableRhythmGameClassDataIds: (input) =>
				getReceivableRhythmGameClassDataFromDatabase(
					getMasterDatabase(),
					input,
				).map((classData) => classData.id),
			projectRhythmMusicScores: (scores) =>
				projectCompatibleMusicProgresses(
					scores,
					getMusicIdentityFingerprints(getMasterDatabase()),
				),
		};
	};
}
