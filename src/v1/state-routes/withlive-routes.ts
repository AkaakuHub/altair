import { Hono } from 'hono';
import type {
	EmptyLiveBroadcastRequest,
	LiveConnectTokenRequest,
	LiveConnectTokenResponse,
	LiveIdQueryRequest,
	LivePrizeQueryRequest,
	WithliveEnterRequest,
	WithliveEnterResponse,
	WithliveGetListResponse,
	WithliveGiftPtRankingsResponse,
	WithliveLiveInfoRequest,
	WithliveLiveInfoResponse,
	WithliveLiveSubinfoResponse,
	WithlivePrizeResponse,
	WithliveResultRankingRequest,
	WithliveResultRankingResponse,
} from '../response-types/live-broadcast-response-types.ts';
import { apkDumpTypedEndpoint } from '../route-support/endpoint-source.ts';
import { unavailable } from '../route-support/live-broadcast-unavailable.ts';
import { getRequestUser } from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';
import { registerWithliveMutationRoutes } from './withlive-mutation-routes.ts';

export function createWithliveRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();

	apkDumpTypedEndpoint<EmptyLiveBroadcastRequest, WithliveGetListResponse>();
	app.post('/v1/withlive/get_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		return c.json({ withlive_info: [] });
	});

	apkDumpTypedEndpoint<WithliveEnterRequest, WithliveEnterResponse>();
	app.post('/v1/withlive/enter', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<LiveConnectTokenRequest, LiveConnectTokenResponse>();
	app.post('/v1/withlive/connect_token', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<WithliveLiveInfoRequest, WithliveLiveInfoResponse>();
	app.get('/v1/withlive/live_info', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<LiveIdQueryRequest, WithliveLiveSubinfoResponse>();
	app.get('/v1/withlive/live_subinfo', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<LiveIdQueryRequest, WithliveGiftPtRankingsResponse>();
	app.get('/v1/withlive/gift_pt_rankings', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<LivePrizeQueryRequest, WithlivePrizeResponse>();
	app.get('/v1/withlive/prize', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<
		WithliveResultRankingRequest,
		WithliveResultRankingResponse
	>();
	app.post('/v1/withlive/result_ranking', (c) => unavailable(c, routeContext));

	registerWithliveMutationRoutes(app, routeContext);
	return app;
}
