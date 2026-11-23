import type { Context } from 'hono';
import { applyRhythmGameSkillLevelUp } from '../../application/card-growth/rhythm-game-skill-level-service.ts';
import { createRhythmGameSkillLevelMasterSource } from '../../master-data/rhythm-game-skill-level-master-data.ts';
import { readJson } from '../http/read-json.ts';
import { createRequestCardGrowthMutationGuard } from './card-growth-mutation-guard.ts';
import {
	cardGrowthMutationErrorCode,
	createCardGrowthMutationResponse,
} from './card-growth-route-result.ts';
import { ensureCardGrowthRouteState } from './card-growth-route-state.ts';
import { getRequestUser, persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function levelUpRhythmGameSkill(
	c: Context,
	routeContext: StateRouteContext,
) {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const database = routeContext.resolveMasterDatabase(c, user);
	const routeState = ensureCardGrowthRouteState(routeContext, user.playerId);
	const result = applyRhythmGameSkillLevelUp(
		createRhythmGameSkillLevelMasterSource(database),
		await readJson(c.req.raw),
		routeState.cards.value,
		routeState.inventory.value,
		createRequestCardGrowthMutationGuard(
			database,
			routeContext.resolveRequestMasterRelease(c, user).masterReleaseId,
		),
	);
	const errorCode = cardGrowthMutationErrorCode(
		result,
		'userCardGrowthNotFound',
	);
	if (errorCode !== undefined) return routeContext.respondError(c, errorCode);
	routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
	persistRouteState(routeContext);
	return c.json(createCardGrowthMutationResponse());
}
