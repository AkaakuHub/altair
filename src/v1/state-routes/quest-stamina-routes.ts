import { Hono } from 'hono';
import type { StaminaRecoveryRequest } from '../../application/stamina-recovery-service.ts';
import { projectUserInventory } from '../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { readJson } from '../http/read-json.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	StaminaRecoveryInfoResponse,
	StaminaRecoveryResultResponse,
} from '../responses/stamina-recovery-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import {
	createStaminaRecoveryInfoResponse,
	recoverStaminaFromRequest,
} from '../route-support/stamina-recovery.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createQuestStaminaRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, respondStored, state, userItemsGetList } =
		routeContext;

	typedEndpoint<EmptyRequest, StaminaRecoveryInfoResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/get_stamina_recovery_info', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const inventoryResult = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const database = routeContext.resolveMasterDatabase(c, user);
		const inventory = projectUserInventory(
			inventoryResult.value,
			createUserOwnedMasterSupport(database),
		);
		const statusResult = routeContext
			.resolveUserStatus(c, user)
			.ensure(state, user.playerId);
		const status = statusResult.value;
		persistRouteStateIfChanged(
			routeContext,
			inventoryResult.created || statusResult.created,
		);
		return respondStored(c, defaultHeaders, {
			body: createStaminaRecoveryInfoResponse(
				status,
				inventory,
				routeContext.date.currentGameDate(),
				routeContext.date.currentDate(),
			),
			statusCode: 200,
		});
	});
	typedEndpoint<StaminaRecoveryRequest, StaminaRecoveryResultResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/recovery_stamina', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const { value: inventory } = ensureUserInventory(
			state,
			user.playerId,
			userItemsGetList,
		);
		const status = routeContext
			.resolveUserStatus(c, user)
			.ensure(state, user.playerId).value;
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const response = recoverStaminaFromRequest(
			masterRelease.database,
			masterRelease.masterReleaseId,
			await readJson(c.req.raw),
			status,
			inventory,
			routeContext.date.currentGameDate(),
			routeContext.date.currentDate(),
		);
		if (!response) {
			return routeContext.respondError(c, 'userItemNotFound');
		}
		persistRouteState(routeContext);
		return respondStored(c, defaultHeaders, {
			body: response,
			statusCode: 200,
		});
	});

	return app;
}
