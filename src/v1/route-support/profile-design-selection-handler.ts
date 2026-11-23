import type { Context } from 'hono';
import {
	ensureUserProfileDesign,
	setProfileDesignSelection,
} from '../../state/profile-design-state.ts';
import { readJson } from '../http/read-json.ts';
import type { ResultResponse } from '../response-types/common-response-types.ts';
import { getStringField } from './request-fields.ts';
import { getRequestUser, persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function profileDesignSelectionError(
	type: 1 | 2,
): 'profileDesignCardIdRequired' | 'profileDesignIconIdRequired' {
	return type === 1
		? 'profileDesignCardIdRequired'
		: 'profileDesignIconIdRequired';
}

export async function handleProfileDesignSelection(
	c: Context,
	routeContext: StateRouteContext,
	type: 1 | 2,
): Promise<Response> {
	const id = getStringField(
		await readJson(c.req.raw),
		'd_profile_my_designs_id',
	);
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const design = ensureUserProfileDesign(
		routeContext.state,
		user.playerId,
	).value;
	if (id.length === 0 || !setProfileDesignSelection(design, type, id)) {
		return routeContext.respondError(c, profileDesignSelectionError(type));
	}
	if (type === 1) {
		routeContext
			.resolveMissionProgress(c, user)
			.apply({ type: 'profileCardSetting', playerId: user.playerId });
	}
	persistRouteState(routeContext);
	return c.json({ result: true } satisfies ResultResponse);
}
