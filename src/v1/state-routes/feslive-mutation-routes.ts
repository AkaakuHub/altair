import type { Hono } from 'hono';
import type {
	EmptyLiveBroadcastResponse,
	FesliveCircleChatCommentRequest,
	FesliveCircleChatCommentResponse,
	FesliveClapRequest,
	FesliveCommentRequest,
	FesliveCommentResponse,
	FesliveEnqueteRequest,
	FesliveGiftRequest,
	FesliveGiftResponse,
	FesliveMessageCardRequest,
	FesliveMessageCardResponse,
	FeslivePenlightColorRequest,
	FesliveSetCameraRequest,
	FesliveSetCameraResponse,
	FesliveSetPrizeRequest,
	SetFlowerStandRequest,
	SetFlowerStandResponse,
} from '../response-types/live-broadcast-response-types.ts';
import { apkDumpTypedEndpoint } from '../route-support/endpoint-source.ts';
import { unavailable } from '../route-support/live-broadcast-unavailable.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function registerFesliveMutationRoutes(
	app: Hono,
	routeContext: StateRouteContext,
): void {
	apkDumpTypedEndpoint<
		FesliveCircleChatCommentRequest,
		FesliveCircleChatCommentResponse
	>();
	app.post('/v1/feslive/circle_chat/comment', (c) =>
		unavailable(c, routeContext),
	);

	apkDumpTypedEndpoint<FesliveCommentRequest, FesliveCommentResponse>();
	app.post('/v1/feslive/comment', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveCommentRequest, FesliveCommentResponse>();
	app.post('/v1/feslive/lobby_comment', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveClapRequest, EmptyLiveBroadcastResponse>();
	app.post('/v1/feslive/clap', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveEnqueteRequest, EmptyLiveBroadcastResponse>();
	app.post('/v1/feslive/enquete', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<
		FeslivePenlightColorRequest,
		EmptyLiveBroadcastResponse
	>();
	app.post('/v1/feslive/penlight_color', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveSetCameraRequest, FesliveSetCameraResponse>();
	app.post('/v1/feslive/set_camera', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<SetFlowerStandRequest, SetFlowerStandResponse>();
	app.post('/v1/feslive/set_flower_stand', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveGiftRequest, FesliveGiftResponse>();
	app.post('/v1/feslive/gift', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveGiftRequest, FesliveGiftResponse>();
	app.post('/v1/feslive/lobby_gift', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveMessageCardRequest, FesliveMessageCardResponse>();
	app.post('/v1/feslive/message_card', (c) => unavailable(c, routeContext));

	apkDumpTypedEndpoint<FesliveMessageCardRequest, FesliveMessageCardResponse>();
	app.post('/v1/feslive/lobby_message_card', (c) =>
		unavailable(c, routeContext),
	);

	apkDumpTypedEndpoint<FesliveSetPrizeRequest, EmptyLiveBroadcastResponse>();
	app.post('/v1/feslive/set_prize', (c) => unavailable(c, routeContext));
}
