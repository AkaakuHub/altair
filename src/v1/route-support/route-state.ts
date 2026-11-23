import type { Context } from 'hono';
import { persistServerState } from '../../server-state.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import { resolveRequestUser } from './request-user.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getRequestUser(
	c: Context,
	routeContext: Pick<
		StateRouteContext,
		'applyResponseHeaders' | 'defaultHeaders' | 'respondError' | 'state'
	>,
): RegisteredUserState | Response {
	const { defaultHeaders, state } = routeContext;
	routeContext.applyResponseHeaders(c, defaultHeaders);
	const user = resolveRequestUser(c.req.raw.headers, state);
	if (user === undefined) {
		return routeContext.respondError(c, 'requestUserNotFound');
	}
	return user;
}

export function withRequestUser(
	c: Context,
	routeContext: Pick<
		StateRouteContext,
		'applyResponseHeaders' | 'defaultHeaders' | 'respondError' | 'state'
	>,
	handle: (user: RegisteredUserState) => Response | Promise<Response>,
): Response | Promise<Response> {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	return handle(user);
}

export function persistRouteState(
	routeContext: Pick<StateRouteContext, 'config' | 'state'>,
): void {
	persistServerState(routeContext.config.stateStore, routeContext.state);
}

export function persistRouteStateIfChanged(
	routeContext: Pick<StateRouteContext, 'config' | 'state'>,
	changed: boolean,
): void {
	if (changed) {
		persistRouteState(routeContext);
	}
}
