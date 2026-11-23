import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import type { RegisteredUserState } from '../../server-state-schema.ts';
import type { StateRouteContext } from './state-route-context.ts';

type MasterReleaseBoundSession = Readonly<{
	masterReleaseId?: string | undefined;
}>;

export function resolveMasterReleaseBoundSessionDatabase(
	c: Context,
	routeContext: StateRouteContext,
	session: MasterReleaseBoundSession,
): Database | Response {
	if (session.masterReleaseId === undefined) {
		return routeContext.respondError(c, 'sessionMasterReleaseUnavailable');
	}
	try {
		return routeContext.resolveMasterReleaseDatabase(session.masterReleaseId);
	} catch {
		return routeContext.respondError(c, 'sessionMasterReleaseUnavailable');
	}
}

export function isSessionVisibleInRequestMasterRelease(
	c: Context,
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	session: MasterReleaseBoundSession,
): boolean {
	return (
		session.masterReleaseId !== undefined &&
		session.masterReleaseId ===
			routeContext.resolveRequestMasterRelease(c, user).masterReleaseId
	);
}
