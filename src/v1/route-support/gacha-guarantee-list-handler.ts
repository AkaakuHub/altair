import type { Context } from 'hono';
import { projectUserCards } from '../../application/user-owned-master-projection.ts';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import {
	getGachaGuaranteeExchangeHeaderDateBySeriesIdFromDatabase,
	getGachaGuaranteeExchangeItemsBySeriesIdFromDatabase,
	getGachaGuaranteeExchangeRateByIdFromDatabase,
} from '../../master-data/gacha-guarantee-master.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { ensureUserGachaState } from '../../state/gacha-aggregate-state.ts';
import {
	applyGachaGuaranteeExchangeItemOwnership,
	resolveGachaGuaranteeExchangeItems,
} from '../../state/gacha-guarantee-ownership.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { readJson } from '../http/read-json.ts';
import { createGachaGuaranteePointListResponse } from '../responses/gacha-response.ts';
import { readGachaGuaranteeListRequest } from './gacha-guarantee-request.ts';
import { getRequestUser, persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createGachaGuaranteeListHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const { gachaSeriesId } = readGachaGuaranteeListRequest(
			await readJson(c.req.raw),
		);
		if (gachaSeriesId === undefined)
			return routeContext.respondError(c, 'gachaSeriesSeedNotFound');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const userGacha = ensureUserGachaState(
			routeContext.state,
			user.playerId,
		).value;
		userGacha.guaranteeExchangeMasterReleaseId = masterRelease.masterReleaseId;
		const userCards = projectUserCards(
			ensureUserCards(
				routeContext.state,
				user.playerId,
				routeContext.userCardGetList,
			).value,
			createUserOwnedMasterSupport(masterRelease.database),
		);
		const items = getGachaGuaranteeExchangeItemsBySeriesIdFromDatabase(
			masterRelease.database,
			gachaSeriesId,
		);
		persistRouteState(routeContext);
		const rates = items
			.map((item) =>
				getGachaGuaranteeExchangeRateByIdFromDatabase(
					masterRelease.database,
					item.exchangePointRateId,
				),
			)
			.filter((rate) => rate !== undefined);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders, {
			user,
			date: getGachaGuaranteeExchangeHeaderDateBySeriesIdFromDatabase(
				masterRelease.database,
				gachaSeriesId,
				routeContext.date.currentDate(),
			),
		});
		return c.json(
			createGachaGuaranteePointListResponse(
				applyGachaGuaranteeExchangeItemOwnership(
					resolveGachaGuaranteeExchangeItems(userGacha, items),
					rates,
					userCards,
					(cardDatasId) =>
						getCardDetailTemplateByCardDatasIdFromDatabase(
							masterRelease.database,
							cardDatasId,
						),
				),
			),
		);
	};
}
