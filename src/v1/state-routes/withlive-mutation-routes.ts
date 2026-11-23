import type { Hono } from 'hono';
import type {
	WithliveCommentRequest,
	WithliveCommentResponse,
	WithliveEnqueteAnswerRequest,
	WithliveEnqueteAnswerResponse,
	WithliveGiftRequest,
	WithliveGiftResponse,
	WithliveMessageCardRequest,
	WithliveMessageCardResponse,
	WithliveSetStarRequest,
	WithliveSetStarResponse,
} from '../response-types/live-broadcast-response-types.ts';
import { apkDumpTypedEndpoint } from '../route-support/endpoint-source.ts';
import { unavailable } from '../route-support/live-broadcast-unavailable.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function registerWithliveMutationRoutes(
	app: Hono,
	routeContext: StateRouteContext,
): void {
	apkDumpTypedEndpoint<WithliveCommentRequest, WithliveCommentResponse>();
	app.post('/v1/withlive/comment', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<
		WithliveEnqueteAnswerRequest,
		WithliveEnqueteAnswerResponse
	>();
	app.post('/v1/withlive/enquetes/answer', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<WithliveGiftRequest, WithliveGiftResponse>();
	app.post('/v1/withlive/gift', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<
		WithliveMessageCardRequest,
		WithliveMessageCardResponse
	>();
	app.post('/v1/withlive/message_card', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<WithliveSetStarRequest, WithliveSetStarResponse>();
	app.post('/v1/withlive/set_star', (c) => unavailable(c, routeContext));
}
