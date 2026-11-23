import type { Context } from 'hono';
import { ensureCircleState } from '../../state/circle-aggregate-state.ts';
import {
	isCircleLeader,
	isCircleMember,
} from '../../state/circle-member-state.ts';
import { createCircleChatLogListResponse } from '../responses/circle-chat-response.ts';
import { readCircleChatLogListConditions } from './circle-request.ts';
import { getRequestUser, persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function runPersistedCircleLeaderAction(
	routeContext: StateRouteContext,
	userPlayerId: string,
	action: () => boolean,
): boolean {
	const circle = ensureCircleState(routeContext.state);
	const result = isCircleLeader(circle, userPlayerId) && action();
	persistRouteStateIfChanged(routeContext, result);
	return result;
}

export function getCircleChatLogList(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	const circle = ensureCircleState(routeContext.state);
	if (!isCircleMember(circle, user.playerId)) {
		return c.json(
			{
				error_code: '06003_012202',
				message: 'サークルに所属していません。',
				title: 'サークル検索エラー',
			},
			403,
		);
	}
	return c.json(
		createCircleChatLogListResponse(
			circle,
			routeContext.state,
			readCircleChatLogListConditions(c.req.url),
		),
	);
}
