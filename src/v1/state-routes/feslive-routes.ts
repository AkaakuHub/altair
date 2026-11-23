import { Hono } from 'hono';
import type {
	EmptyLiveBroadcastRequest,
	FesliveEnterRequest,
	FesliveEnterResponse,
	FesliveGetGiftShopListRequest,
	FesliveGetGiftShopListResponse,
	FesliveGetListResponse,
	FesliveGiftPtRankingsResponse,
	FesliveGrandPrixRankingRequest,
	FesliveGrandPrixRankingResponse,
	FesliveLiveAnnouncementResponse,
	FesliveLiveInfoRequest,
	FesliveLiveInfoResponse,
	FesliveLiveSubinfoResponse,
	FesliveLobbyAnnouncementResponse,
	FesliveLobbyInfoRequest,
	FesliveLobbyInfoResponse,
	FesliveLobbyRequest,
	FesliveLobbyResponse,
	FesliveLobbySubinfoResponse,
	FesliveOutQuestLiveRankingRequest,
	FesliveOutQuestLiveRankingResponse,
	FeslivePrizeResponse,
	LiveConnectTokenRequest,
	LiveConnectTokenResponse,
	LiveIdQueryRequest,
	LivePrizeQueryRequest,
} from '../response-types/live-broadcast-response-types.ts';
import { apkDumpTypedEndpoint } from '../route-support/endpoint-source.ts';
import { getGiftShopList } from '../route-support/gift-shop-list-handler.ts';
import { unavailable } from '../route-support/live-broadcast-unavailable.ts';
import { getRequestUser } from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';
import { registerFesliveMutationRoutes } from './feslive-mutation-routes.ts';

export function createFesliveRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();

	apkDumpTypedEndpoint<EmptyLiveBroadcastRequest, FesliveGetListResponse>();
	app.post('/v1/feslive/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		return c.json({ feslive_info: [] });
	});

	apkDumpTypedEndpoint<FesliveEnterRequest, FesliveEnterResponse>();
	app.post('/v1/feslive/enter', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveLobbyRequest, FesliveLobbyResponse>();
	app.post('/v1/feslive/lobby', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<LiveConnectTokenRequest, LiveConnectTokenResponse>();
	app.post('/v1/feslive/connect_token', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<
		FesliveGetGiftShopListRequest,
		FesliveGetGiftShopListResponse
	>();
	app.post('/v1/feslive/get_gift_shop_list', (c) =>
		getGiftShopList(c, routeContext, 'feslive'),
	);

	apkDumpTypedEndpoint<FesliveLiveInfoRequest, FesliveLiveInfoResponse>();
	app.get('/v1/feslive/live_info', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<LiveIdQueryRequest, FesliveLiveSubinfoResponse>();
	app.get('/v1/feslive/live_subinfo', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveLobbyInfoRequest, FesliveLobbyInfoResponse>();
	app.get('/v1/feslive/lobby_info', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<LiveIdQueryRequest, FesliveLobbySubinfoResponse>();
	app.get('/v1/feslive/lobby_subinfo', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<LiveIdQueryRequest, FesliveLiveAnnouncementResponse>();
	app.get('/v1/feslive/live_announcement', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<LiveIdQueryRequest, FesliveLobbyAnnouncementResponse>();
	app.get('/v1/feslive/lobby_announcement', (c) =>
		unavailable(c, routeContext),
	);

	apkDumpTypedEndpoint<LiveIdQueryRequest, FesliveGiftPtRankingsResponse>();
	app.get('/v1/feslive/gift_pt_rankings', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<
		FesliveGrandPrixRankingRequest,
		FesliveGrandPrixRankingResponse
	>();
	app.post('/v1/feslive/grand_prix_ranking', (c) =>
		unavailable(c, routeContext),
	);

	apkDumpTypedEndpoint<
		FesliveOutQuestLiveRankingRequest,
		FesliveOutQuestLiveRankingResponse
	>();
	app.post('/v1/feslive/out_quest_live_ranking', (c) =>
		unavailable(c, routeContext),
	);

	apkDumpTypedEndpoint<LivePrizeQueryRequest, FeslivePrizeResponse>();
	app.get('/v1/feslive/prize', (c) => unavailable(c, routeContext));

	registerFesliveMutationRoutes(app, routeContext);
	return app;
}
