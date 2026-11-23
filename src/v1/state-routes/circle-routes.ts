import { Hono } from 'hono';
import type {
	CircleChatLogQuery,
	CircleChatMessageRequest,
	CircleCreateRequest,
	CircleInvitationRequest,
	CircleKeyRequest,
	CirclePositionRequest,
	CircleSearchRequest,
	CircleSettingRequest,
} from '../response-types/circle-request-types.ts';
import type {
	CircleChatLogListResponse,
	CircleDetailResponse,
	CircleGetInfoResponse,
	CircleInviteAndJoinInfoResponse,
	CircleInviteListResponse,
	CircleListResponse,
	CircleSetChatMessageResponse,
	CircleTopInfoResponse,
} from '../response-types/circle-response-types.ts';
import type { ResultResponse } from '../response-types/common-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { ProfileTargetRequest } from '../response-types/profile-request-types.ts';
import {
	approveCircleJoin,
	cancelCircleJoin,
	createCircle,
	dismissCircleMember,
	dissolveCircle,
	expelCircleUser,
	leaveCircle,
	rejectCircleJoin,
	setCircleChatMessage,
	setCircleJoin,
	setCircleMemberPosition,
	setCircleSetting,
	transferCircleLeadership,
} from '../route-support/circle-mutation-handlers.ts';
import {
	getCircleChatLogs,
	getCircleDetail,
	getCircleInfo,
	getCircleInviteAndJoinInfo,
	getCircleInviteList,
	getCircleList,
	getCircleTopInfo,
} from '../route-support/circle-read-handlers.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../route-support/endpoint-source.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createCircleRoutes(context: StateRouteContext): Hono {
	const app = new Hono();
	typedEndpoint<EmptyRequest, CircleTopInfoResponse>({ requiresSession: true });
	app.post('/v1/circle/get_circle_top_info', (c) =>
		getCircleTopInfo(c, context),
	);
	typedEndpoint<CircleSearchRequest, CircleListResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/get_list', (c) => getCircleList(c, context));
	typedEndpoint<EmptyRequest, CircleInviteListResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/get_invite_list', (c) =>
		getCircleInviteList(c, context),
	);
	typedEndpoint<CircleKeyRequest, CircleDetailResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/get_detail', (c) => getCircleDetail(c, context));
	typedEndpoint<CircleKeyRequest, CircleGetInfoResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/get_info', (c) => getCircleInfo(c, context));
	typedEndpoint<EmptyRequest, CircleInviteAndJoinInfoResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/get_invite_and_join_info', (c) =>
		getCircleInviteAndJoinInfo(c, context),
	);
	typedEndpoint<CircleChatLogQuery, CircleChatLogListResponse>({
		requiresSession: true,
	});
	app.get('/v1/circle/get_chat_log_list', (c) => getCircleChatLogs(c, context));
	typedEndpoint<EmptyRequest, CircleChatLogListResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/get_chat_log_list', (c) =>
		getCircleChatLogs(c, context),
	);
	typedEndpoint<CircleChatMessageRequest, CircleSetChatMessageResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_chat_message', (c) =>
		setCircleChatMessage(c, context),
	);
	typedEndpoint<CircleKeyRequest, ResultResponse>({ requiresSession: true });
	app.post('/v1/circle/set_join', (c) => setCircleJoin(c, context));
	apkDumpTypedEndpoint<CircleInvitationRequest, ResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_cancel_join', (c) => cancelCircleJoin(c, context));
	typedEndpoint<CircleCreateRequest, CircleGetInfoResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_create', (c) => createCircle(c, context));
	typedEndpoint<CircleSettingRequest, ResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_setting', (c) => setCircleSetting(c, context));
	typedEndpoint<CircleInvitationRequest, ResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_approve_join', (c) => approveCircleJoin(c, context));
	typedEndpoint<CircleInvitationRequest, ResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_reject_join', (c) => rejectCircleJoin(c, context));
	typedEndpoint<CirclePositionRequest, ResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_position', (c) =>
		setCircleMemberPosition(c, context),
	);
	typedEndpoint<ProfileTargetRequest, ResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_dismissal', (c) => dismissCircleMember(c, context));
	typedEndpoint<ProfileTargetRequest, ResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_expulsion', (c) => expelCircleUser(c, context));
	apkDumpTypedEndpoint<EmptyRequest, ResultResponse>({ requiresSession: true });
	app.post('/v1/circle/set_out', (c) => leaveCircle(c, context));
	typedEndpoint<ProfileTargetRequest, ResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/circle/set_transfer_leader', (c) =>
		transferCircleLeadership(c, context),
	);
	typedEndpoint<EmptyRequest, ResultResponse>({ requiresSession: true });
	app.post('/v1/circle/set_dissolution', (c) => dissolveCircle(c, context));
	return app;
}
