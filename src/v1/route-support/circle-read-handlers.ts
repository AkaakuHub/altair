import type { Context } from 'hono';
import { ensureCircleState } from '../../state/circle-aggregate-state.ts';
import { readJson } from '../http/read-json.ts';
import {
	createCircleDetailResponse,
	createCircleGetInfoResponse,
	createCircleListResponse,
	createCircleTopInfoResponse,
} from '../responses/circle-directory-response.ts';
import {
	createCircleInviteAndJoinInfoResponse,
	createCircleInviteListResponse,
} from '../responses/circle-membership-response.ts';
import {
	readCircleSearchConditions,
	readStringField,
} from './circle-request.ts';
import { getCircleChatLogList } from './circle-route-actions.ts';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getCircleTopInfo(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	return c.json(
		createCircleTopInfoResponse(
			routeContext.resolveMasterDatabase(c, user),
			ensureCircleState(routeContext.state),
			user,
			routeContext.state,
		),
	);
}
export async function getCircleList(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	return c.json(
		createCircleListResponse(
			ensureCircleState(routeContext.state),
			readCircleSearchConditions(await readJson(c.req.raw)),
		),
	);
}
export function getCircleInviteList(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	return c.json(createCircleInviteListResponse());
}
export async function getCircleDetail(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const body = await readJson(c.req.raw);
	return c.json(
		createCircleDetailResponse(
			routeContext.resolveMasterDatabase(c, user),
			ensureCircleState(routeContext.state),
			routeContext.state,
			readStringField(body, 'search_guild_key'),
		),
	);
}
export async function getCircleInfo(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	return c.json(
		createCircleGetInfoResponse(
			ensureCircleState(routeContext.state),
			user,
			readStringField(await readJson(c.req.raw), 'search_guild_key'),
		),
	);
}
export function getCircleInviteAndJoinInfo(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	return c.json(
		createCircleInviteAndJoinInfoResponse(
			ensureCircleState(routeContext.state),
			routeContext.state,
		),
	);
}
export function getCircleChatLogs(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	return getCircleChatLogList(c, routeContext);
}
