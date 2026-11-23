import { Hono } from 'hono';
import { getActiveGachaSeriesAdminSummary } from '../../../application/gacha-availability-service.ts';
import { getGachaSeriesProvenance } from '../../../master-data/gacha-series-identity.ts';
import { getGachaSeriesAdminSummaryFromDatabase } from '../../../master-data/gacha-series-master.ts';
import { jstGameDate } from '../../../master-data/master-time.ts';
import { ensureUserGachaState } from '../../../state/gacha-aggregate-state.ts';
import { ensureUserInventory } from '../../../state/user-inventory-aggregate.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type { GachaSeriesListResponse } from '../../response-types/gacha-response-types.ts';
import { createGachaSeriesListResponse } from '../../responses/gacha-response.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import {
	getRequestUser,
	persistRouteStateIfChanged,
} from '../../route-support/route-state.ts';
import { getActiveSelectTicketSeriesList } from '../../route-support/select-ticket-exchange-route-state.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createGachaListRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { state, userItemsGetList } = routeContext;

	typedEndpoint<EmptyRequest, GachaSeriesListResponse>({
		requiresSession: true,
	});
	app.post('/v1/gacha/get_series_list', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const masterDatabase = masterRelease.database;
		const userGachaResult = ensureUserGachaState(state, user.playerId);
		const userGacha = userGachaResult.value;
		const hasActiveSelectTicketSeries =
			state.selectTicketSeriesActivations.some(
				(activation) => activation.isEnabled,
			);
		const inventoryResult = hasActiveSelectTicketSeries
			? ensureUserInventory(state, user.playerId, userItemsGetList)
			: undefined;
		const inventory = inventoryResult?.value;
		persistRouteStateIfChanged(
			routeContext,
			userGachaResult.created || inventoryResult?.created === true,
		);
		return c.json(
			createGachaSeriesListResponse(
				userGacha,
				getActiveGachaSeriesAdminSummary(
					getGachaSeriesAdminSummaryFromDatabase(masterDatabase),
					state.gachaSeriesActivations,
				),
				jstGameDate(routeContext.date.currentDate()),
				inventory === undefined
					? []
					: getActiveSelectTicketSeriesList(masterDatabase, inventory, state),
				(gachaSeriesId) =>
					getGachaSeriesProvenance(
						masterDatabase,
						masterRelease.masterReleaseId,
						gachaSeriesId,
					),
			),
		);
	});

	return app;
}
