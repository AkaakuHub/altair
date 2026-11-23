import type { Context } from 'hono';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import { getCardIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import { getDuplicateCardRewardFromDatabase } from '../../master-data/gacha-duplicate-card-reward.ts';
import {
	getGachaGuaranteeExchangeHeaderDateBySeriesIdFromDatabase,
	getGachaGuaranteeExchangeRateByIdFromDatabase,
} from '../../master-data/gacha-guarantee-master.ts';
import { getGachaSeriesProvenance } from '../../master-data/gacha-series-identity.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { canApplyUserCardProvenance } from '../../state/user-card-template-state.ts';
import { readJson } from '../http/read-json.ts';
import { createGachaGuaranteePointExchangeResponse } from '../responses/gacha-response.ts';
import { getGachaGuaranteeMasterReleaseSession } from './gacha-guarantee-master-release-session.ts';
import { readGachaGuaranteeExchangeRequest } from './gacha-guarantee-request.ts';
import { applyGachaGuaranteeRewardTransaction } from './gacha-guarantee-reward-transaction.ts';
import { persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createGachaGuaranteeExchangeHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const { exchangePointRateId } = readGachaGuaranteeExchangeRequest(
			await readJson(c.req.raw),
		);
		const session = getGachaGuaranteeMasterReleaseSession(c, routeContext);
		if (session instanceof Response) return session;
		if (exchangePointRateId === undefined)
			return routeContext.respondError(c, 'gachaGuaranteeExchangeRateRequired');
		const exchangeRate = getGachaGuaranteeExchangeRateByIdFromDatabase(
			session.database,
			exchangePointRateId,
		);
		if (!exchangeRate)
			return routeContext.respondError(c, 'gachaGuaranteeExchangeRateNotFound');
		const seriesProvenance = getGachaSeriesProvenance(
			session.database,
			session.sourceMasterReleaseId,
			exchangeRate.gachaSeriesId,
		);
		if (seriesProvenance === undefined)
			return routeContext.respondError(c, 'gachaGuaranteeExchangeRateNotFound');
		const userCards = ensureUserCards(
			routeContext.state,
			session.user.playerId,
			routeContext.userCardGetList,
		).value;
		const cardTemplate =
			exchangeRate.exchangeItemType === 2
				? getCardDetailTemplateByCardDatasIdFromDatabase(
						session.database,
						exchangeRate.exchangeItemId,
					)
				: undefined;
		const cardIdentity =
			exchangeRate.exchangeItemType === 2
				? getCardIdentityFingerprint(
						session.database,
						exchangeRate.exchangeItemId,
					)
				: undefined;
		const cardProvenance =
			cardIdentity === undefined
				? undefined
				: {
						sourceMasterReleaseId: session.sourceMasterReleaseId,
						identityFingerprint: cardIdentity,
					};
		if (
			exchangeRate.exchangeItemType === 2 &&
			(!cardTemplate ||
				!cardProvenance ||
				!canApplyUserCardProvenance(userCards, cardTemplate, cardProvenance))
		)
			return routeContext.respondError(c, 'gachaGuaranteeExchangeInvalid');
		const receiptItems = applyGachaGuaranteeRewardTransaction(
			session.database,
			routeContext,
			session.user.playerId,
			session.sourceMasterReleaseId,
			session.userGacha,
			userCards,
			(cardDatasId) => {
				const template = getCardDetailTemplateByCardDatasIdFromDatabase(
					session.database,
					cardDatasId,
				);
				const identity = getCardIdentityFingerprint(
					session.database,
					cardDatasId,
				);
				return template === undefined || identity === undefined
					? undefined
					: {
							...template,
							source_master_release_id: session.sourceMasterReleaseId,
							identity_fingerprint: identity,
						};
			},
			exchangeRate,
			seriesProvenance,
			(cardDatasId) =>
				getDuplicateCardRewardFromDatabase(session.database, cardDatasId),
			cardTemplate,
			cardProvenance,
		);
		if (!receiptItems)
			return routeContext.respondError(c, 'gachaGuaranteeExchangeInvalid');
		delete session.userGacha.guaranteeExchangeMasterReleaseId;
		persistRouteState(routeContext);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders, {
			user: session.user,
			date: getGachaGuaranteeExchangeHeaderDateBySeriesIdFromDatabase(
				session.database,
				exchangeRate.gachaSeriesId,
				routeContext.date.currentDate(),
			),
		});
		return c.json(createGachaGuaranteePointExchangeResponse(receiptItems));
	};
}
