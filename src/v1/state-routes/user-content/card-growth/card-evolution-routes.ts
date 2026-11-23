import { Hono } from 'hono';
import { applyEvolution } from '../../../../application/card-growth/card-evolution-mutation.ts';
import { createCheckEvolutionResponse } from '../../../../application/card-growth/card-evolution-plan.ts';
import type {
	CardGrowthMutationResponse,
	EvolutionCheckResponse,
} from '../../../../application/card-growth/card-growth-response.ts';
import { getCardIdentityFingerprint } from '../../../../master-data/entity-identity-fingerprints.ts';
import { updateUserCardEvolution } from '../../../../state/user-card-progress-mutation.ts';
import { readJson } from '../../../http/read-json.ts';
import type { UserCardDetailRequest } from '../../../response-types/user-card-deck-request-types.ts';
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

export function createCardEvolutionRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, state } = routeContext;
	typedEndpoint<UserCardDetailRequest, EvolutionCheckResponse>({
		requiresSession: true,
	});
	app.post('/v1/user/card/check_evolution', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const database = routeContext.resolveMasterDatabase(c, user);
		const routeState = ensureCardGrowthRouteState(routeContext, user.playerId);
		const response = createCheckEvolutionResponse(
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
	typedEndpoint<UserCardDetailRequest, CardGrowthMutationResponse>({
		requiresSession: true,
	});
	app.post('/v1/user/card/evolution', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const routeState = ensureCardGrowthRouteState(routeContext, user.playerId);
		const result = applyEvolution(
			createCardGrowthMasterSource(masterRelease.database),
			await readJson(c.req.raw),
			routeState.cards.value,
			routeState.inventory.value,
			createRequestCardGrowthMutationGuard(
				masterRelease.database,
				masterRelease.masterReleaseId,
			),
			(update) => {
				const identityFingerprint = getCardIdentityFingerprint(
					masterRelease.database,
					update.nextCard.card_datas_id,
				);
				if (identityFingerprint === undefined) return false;
				return updateUserCardEvolution(
					state,
					user.playerId,
					update.dCardDatasId,
					{
						...update.nextCard,
						source_master_release_id: masterRelease.masterReleaseId,
						identity_fingerprint: identityFingerprint,
					},
				);
			},
		);
		const errorCode = cardGrowthMutationErrorCode(
			result,
			'userCardEvolutionUnavailable',
		);
		if (errorCode !== undefined) return routeContext.respondError(c, errorCode);
		routeContext.applyResponseHeaders(c, defaultHeaders);
		persistRouteState(routeContext);
		return c.json(createCardGrowthMutationResponse());
	});
	return app;
}
