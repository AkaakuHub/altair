import { Hono } from 'hono';
import type {
	WithstationCommentRequest,
	WithstationCommentResponse,
	WithstationGiftPtRankingsRequest,
	WithstationGiftPtRankingsResponse,
} from '../response-types/withstation-response-types.ts';
import type {
	WithstationGiftRequest,
	WithstationGiftResponse,
	WithstationInfoRequest,
	WithstationInfoResponse,
	WithstationMessageCardRequest,
	WithstationMessageCardResponse,
	WithstationPrizeRequest,
	WithstationPrizeResponse,
	WithstationStarsRequest,
	WithstationStarsResponse,
} from '../response-types/withstation-session-response-types.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../route-support/endpoint-source.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';
import { sendWithstationComment } from '../route-support/withstation-comment-handler.ts';
import { sendWithstationGift } from '../route-support/withstation-gift-handler.ts';
import { getWithstationInfo } from '../route-support/withstation-info-handler.ts';
import { sendWithstationMessageCard } from '../route-support/withstation-message-card-handler.ts';
import { getWithstationPrize } from '../route-support/withstation-prize-handler.ts';
import { getWithstationGiftPointRankings } from '../route-support/withstation-ranking-handler.ts';
import { setWithstationPrizeStars } from '../route-support/withstation-star-handler.ts';

export function createWithStationRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	apkDumpTypedEndpoint<WithstationCommentRequest, WithstationCommentResponse>();
	app.post('/v1/withstation/comment', (c) =>
		sendWithstationComment(c, routeContext),
	);
	apkDumpTypedEndpoint<
		WithstationGiftPtRankingsRequest,
		WithstationGiftPtRankingsResponse
	>();
	app.get('/v1/withstation/gift_pt_rankings', (c) =>
		getWithstationGiftPointRankings(c, routeContext),
	);
	typedEndpoint<WithstationInfoRequest, WithstationInfoResponse>({
		requiresSession: true,
	});
	app.on(['GET', 'POST'], '/v1/withstation/withstation_info', (c) =>
		getWithstationInfo(c, routeContext),
	);
	typedEndpoint<WithstationMessageCardRequest, WithstationMessageCardResponse>({
		requiresSession: true,
	});
	app.post('/v1/withstation/message_card', (c) =>
		sendWithstationMessageCard(c, routeContext),
	);
	typedEndpoint<WithstationGiftRequest, WithstationGiftResponse>({
		requiresSession: true,
	});
	app.post('/v1/withstation/gift', (c) => sendWithstationGift(c, routeContext));
	typedEndpoint<WithstationPrizeRequest, WithstationPrizeResponse>({
		requiresSession: true,
	});
	app.get('/v1/withstation/prize', (c) => getWithstationPrize(c, routeContext));
	typedEndpoint<WithstationStarsRequest, WithstationStarsResponse>({
		requiresSession: true,
	});
	app.post('/v1/withstation/set_star', (c) =>
		setWithstationPrizeStars(c, routeContext),
	);
	return app;
}
