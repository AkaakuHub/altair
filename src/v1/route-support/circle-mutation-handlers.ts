import type { Context } from 'hono';
import { ensureGrandPrixRuntimeState } from '../../server-state.ts';
import {
	createCircleStateFromApiInput,
	dissolveCircleState,
	ensureCircleState,
	updateCircleStateFromApiInput,
} from '../../state/circle-aggregate-state.ts';
import { appendCircleChatMessage } from '../../state/circle-chat-message-state.ts';
import { getLatestCircleChatOrderId } from '../../state/circle-chat-state.ts';
import {
	approveCircleJoinRequest,
	rejectCircleJoinRequest,
	removeCircleJoinRequest,
	requestCircleJoin,
} from '../../state/circle-join-state.ts';
import {
	changeCircleMemberPosition,
	dismissCircleSubLeader,
	expelCircleMember,
	transferCircleLeader,
} from '../../state/circle-member-state.ts';
import { readJson } from '../http/read-json.ts';
import { createCircleSetChatMessageResponse } from '../responses/circle-chat-response.ts';
import {
	createCircleSetCreateResponse,
	createCircleSetSettingResponse,
} from '../responses/circle-membership-response.ts';
import {
	isCircleCreateLocked,
	readCircleCreateApiInput,
	readCircleSettingApiInput,
	readNumberField,
	readStringField,
} from './circle-request.ts';
import { runPersistedCircleLeaderAction } from './circle-route-actions.ts';
import {
	createCircleCreateLockedResponse,
	createCircleResultResponse,
} from './circle-route-responses.ts';
import { getRequestUser, persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function setCircleChatMessage(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	const comment = appendCircleChatMessage(
		await readJson(c.req.raw),
		ensureCircleState(context.state),
		user,
		new Date().toISOString(),
	);
	persistRouteState(context);
	c.header(
		'latest_chat_order_id',
		String(getLatestCircleChatOrderId(context.state.circle)),
	);
	return c.json(createCircleSetChatMessageResponse(comment));
}
export async function setCircleJoin(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	requestCircleJoin(
		context.state,
		user.playerId,
		readStringField(await readJson(c.req.raw), 'search_guild_key'),
		new Date().toISOString(),
	);
	persistRouteState(context);
	return c.json({ result: true });
}
export async function cancelCircleJoin(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	const result = removeCircleJoinRequest(
		context.state,
		readStringField(await readJson(c.req.raw), 'd_guild_invitations_id'),
	);
	persistRouteState(context);
	return c.json(createCircleResultResponse(result));
}
export async function createCircle(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	if (isCircleCreateLocked(ensureGrandPrixRuntimeState(context.state)))
		return c.json(createCircleCreateLockedResponse(), 403);
	const circle = createCircleStateFromApiInput(
		context.state,
		user,
		readCircleCreateApiInput(await readJson(c.req.raw)),
	);
	persistRouteState(context);
	return c.json(createCircleSetCreateResponse(circle));
}
export async function setCircleSetting(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	const input = readCircleSettingApiInput(await readJson(c.req.raw));
	return c.json(
		createCircleSetSettingResponse(
			runPersistedCircleLeaderAction(context, user.playerId, () =>
				updateCircleStateFromApiInput(context.state, input),
			),
		),
	);
}
export async function approveCircleJoin(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return runLeaderBodyAction(c, context, (body) =>
		approveCircleJoinRequest(
			context.state,
			readStringField(body, 'd_guild_invitations_id'),
		),
	);
}
export async function rejectCircleJoin(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return runLeaderBodyAction(c, context, (body) =>
		rejectCircleJoinRequest(
			context.state,
			readStringField(body, 'd_guild_invitations_id'),
		),
	);
}
export async function setCircleMemberPosition(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return runLeaderBodyAction(c, context, (body) =>
		changeCircleMemberPosition(
			context.state,
			readStringField(body, 'player_id'),
			readNumberField(body, 'position_type'),
		),
	);
}
export async function dismissCircleMember(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return runLeaderBodyAction(c, context, (body) =>
		dismissCircleSubLeader(context.state, readStringField(body, 'player_id')),
	);
}
export async function expelCircleUser(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return runLeaderBodyAction(c, context, (body) =>
		expelCircleMember(context.state, readStringField(body, 'player_id')),
	);
}
export async function transferCircleLeadership(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return runLeaderBodyAction(c, context, (body) =>
		transferCircleLeader(context.state, readStringField(body, 'player_id')),
	);
}
export function leaveCircle(c: Context, context: StateRouteContext): Response {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	const result = expelCircleMember(context.state, user.playerId);
	persistRouteState(context);
	return c.json(createCircleResultResponse(result));
}
export function dissolveCircle(
	c: Context,
	context: StateRouteContext,
): Response {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	return c.json(
		createCircleResultResponse(
			runPersistedCircleLeaderAction(context, user.playerId, () =>
				dissolveCircleState(context.state, user.playerId),
			),
		),
	);
}
async function runLeaderBodyAction(
	c: Context,
	context: StateRouteContext,
	action: (body: Awaited<ReturnType<typeof readJson>>) => boolean,
): Promise<Response> {
	const user = getRequestUser(c, context);
	if (user instanceof Response) return user;
	const body = await readJson(c.req.raw);
	const result = runPersistedCircleLeaderAction(context, user.playerId, () =>
		action(body),
	);
	return c.json(createCircleResultResponse(result));
}
