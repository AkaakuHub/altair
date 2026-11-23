import { Hono } from 'hono';
import type {
	CardGrowthMutationResponse,
	SkillLevelUpCheckResponse,
} from '../../../../application/card-growth/card-growth-response.ts';
import {
	applySkillLevelUp,
	createCheckSkillLevelUpResponse,
} from '../../../../application/card-growth/card-skill-level-service.ts';
import { updateUserCardSkillLevel } from '../../../../state/user-card-progress-mutation.ts';
import { readJson } from '../../../http/read-json.ts';
import type {
	CardSkillCheckRequest,
	CardSkillLevelUpRequest,
} from '../../../response-types/card-growth-request-types.ts';
import { createCardGrowthMasterSource } from '../../../route-support/card-growth-master-source.ts';
import { createRequestCardGrowthMutationGuard } from '../../../route-support/card-growth-mutation-guard.ts';
import {
	cardGrowthMutationErrorCode,
	createCardGrowthMutationResponse,
} from '../../../route-support/card-growth-route-result.ts';
import { ensureCardGrowthRouteState } from '../../../route-support/card-growth-route-state.ts';
import { persistCardRouteStateIfChanged } from '../../../route-support/card-route-state.ts';
import { typedEndpoint } from '../../../route-support/endpoint-source.ts';
import {
	getRequestUser,
	persistRouteState,
} from '../../../route-support/route-state.ts';
import type { StateRouteContext } from '../../../route-support/state-route-context.ts';

export function createCardSkillGrowthRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, state } = routeContext;
	typedEndpoint<CardSkillCheckRequest, SkillLevelUpCheckResponse>({
		requiresSession: true,
	});
	app.post('/v1/user/card/check_skill_level_up', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const database = routeContext.resolveMasterDatabase(c, user);
		const routeState = ensureCardGrowthRouteState(routeContext, user.playerId);
		const response = createCheckSkillLevelUpResponse(
			createCardGrowthMasterSource(database),
			await readJson(c.req.raw),
			routeState.cards.value,
			routeState.inventory.value,
		);
		if (!response) return routeContext.respondError(c, 'userCardNotFound');
		if (response === 'masterDataNotFound') {
			return routeContext.respondError(c, 'userCardGrowthNotFound');
		}
		routeContext.applyResponseHeaders(c, defaultHeaders);
		persistCardRouteStateIfChanged(
			routeContext,
			routeState.cards.created,
			routeState.inventory.created,
		);
		return c.json(response);
	});
	typedEndpoint<CardSkillLevelUpRequest, CardGrowthMutationResponse>({
		requiresSession: true,
	});
	app.post('/v1/user/card/skill_level_up', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const database = routeContext.resolveMasterDatabase(c, user);
		const routeState = ensureCardGrowthRouteState(routeContext, user.playerId);
		const result = applySkillLevelUp(
			createCardGrowthMasterSource(database),
			await readJson(c.req.raw),
			routeState.cards.value,
			routeState.inventory.value,
			createRequestCardGrowthMutationGuard(
				database,
				routeContext.resolveRequestMasterRelease(c, user).masterReleaseId,
			),
			(update) =>
				updateUserCardSkillLevel(
					state,
					user.playerId,
					update.dCardDatasId,
					update.skillType,
					update.skillLevel,
				),
		);
		const errorCode = cardGrowthMutationErrorCode(
			result,
			'userCardGrowthNotFound',
		);
		if (errorCode !== undefined) return routeContext.respondError(c, errorCode);
		routeContext.applyResponseHeaders(c, defaultHeaders);
		persistRouteState(routeContext);
		return c.json(createCardGrowthMutationResponse());
	});
	return app;
}
