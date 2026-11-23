import type { Context } from 'hono';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import { getCardIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import { getExchangeDuplicateCardRewardFromDatabase } from '../../master-data/gacha-duplicate-card-reward.ts';
import { getGachaExchangeCardsBySelectTicketSeriesIdsFromDatabase } from '../../master-data/gacha-exchange-card-master.ts';
import {
	getGachaSelectTicketExchangeRateByIdFromDatabase,
	getSelectTicketExchangeTicketItemIdBySeriesIdFromDatabase,
} from '../../master-data/gacha-select-ticket-master.ts';
import { createSelectTicketExchangeReceiptItems } from '../../state/gacha-select-ticket-receipt.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { canApplyUserCardProvenance } from '../../state/user-card-template-state.ts';
import {
	ensureUserInventory,
	findUserItemByItemId,
} from '../../state/user-inventory-aggregate.ts';
import { readJson } from '../http/read-json.ts';
import { createSelectTicketExchangeReceipt } from '../responses/gacha-response.ts';
import { persistRouteState } from './route-state.ts';
import { getSelectTicketMasterReleaseSession } from './select-ticket-master-release-session.ts';
import { readSelectTicketExchangeRequest } from './select-ticket-request.ts';
import { applySelectTicketRewardTransaction } from './select-ticket-reward-transaction.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createSelectTicketExchangeHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const { selectTicketExchangeRateId } = readSelectTicketExchangeRequest(
			await readJson(c.req.raw),
		);
		const session = getSelectTicketMasterReleaseSession(c, routeContext);
		if (session instanceof Response) return session;
		if (selectTicketExchangeRateId === undefined) {
			return routeContext.respondError(c, 'selectTicketExchangeRateIdRequired');
		}
		const exchangeRate = getGachaSelectTicketExchangeRateByIdFromDatabase(
			session.database,
			selectTicketExchangeRateId,
		);
		if (!exchangeRate)
			return routeContext.respondError(c, 'gachaExchangeCardNotFound');
		const playerId = session.user.playerId;
		const inventory = ensureUserInventory(
			routeContext.state,
			playerId,
			routeContext.userItemsGetList,
		).value;
		const exchangeTicketItemId =
			getSelectTicketExchangeTicketItemIdBySeriesIdFromDatabase(
				session.database,
				exchangeRate.selectTicketSeriesId,
			);
		if (
			exchangeTicketItemId === undefined ||
			(findUserItemByItemId(inventory, exchangeTicketItemId)?.itemNum ?? 0) <= 0
		) {
			return routeContext.respondError(c, 'selectTicketNotAvailable');
		}
		const exchangeCardList =
			getGachaExchangeCardsBySelectTicketSeriesIdsFromDatabase(
				session.database,
				[exchangeRate.selectTicketSeriesId],
			);
		const cards = ensureUserCards(
			routeContext.state,
			playerId,
			routeContext.userCardGetList,
		).value;
		const cardTemplate =
			exchangeRate.exchangeItemType === 2
				? getCardDetailTemplateByCardDatasIdFromDatabase(
						session.database,
						exchangeRate.exchangeItemId,
					)
				: undefined;
		const cardIdentityFingerprint =
			exchangeRate.exchangeItemType === 2
				? getCardIdentityFingerprint(
						session.database,
						exchangeRate.exchangeItemId,
					)
				: undefined;
		const cardProvenance =
			cardIdentityFingerprint === undefined
				? undefined
				: {
						sourceMasterReleaseId: session.sourceMasterReleaseId,
						identityFingerprint: cardIdentityFingerprint,
					};
		if (
			exchangeRate.exchangeItemType === 2 &&
			(!cardTemplate ||
				!cardProvenance ||
				!canApplyUserCardProvenance(cards, cardTemplate, cardProvenance))
		) {
			return routeContext.respondError(c, 'selectTicketNotAvailable');
		}
		const receiptItems = createSelectTicketExchangeReceiptItems(
			cards,
			(cardDatasId) =>
				getCardDetailTemplateByCardDatasIdFromDatabase(
					session.database,
					cardDatasId,
				),
			exchangeRate,
			exchangeCardList,
			(cardDatasId) =>
				getExchangeDuplicateCardRewardFromDatabase(
					session.database,
					cardDatasId,
				),
		);
		if (!receiptItems)
			return routeContext.respondError(c, 'selectTicketNotAvailable');
		if (
			!applySelectTicketRewardTransaction(
				routeContext,
				session,
				inventory,
				cards,
				exchangeTicketItemId,
				receiptItems,
				cardTemplate,
				cardProvenance,
			)
		) {
			return routeContext.respondError(c, 'selectTicketNotAvailable');
		}
		persistRouteState(routeContext);
		return c.json(createSelectTicketExchangeReceipt(receiptItems));
	};
}
