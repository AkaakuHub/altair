import type { Context } from 'hono';
import { getActiveGachaSeriesAdminSummary } from '../../application/gacha-availability-service.ts';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import { getCardIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import {
	getGachaDrawRatesBySeriesIdFromDatabase,
	getGachaPurchaseCostBySeriesIdFromDatabase,
} from '../../master-data/gacha-draw-master.ts';
import { getDuplicateCardRewardFromDatabase } from '../../master-data/gacha-duplicate-card-reward.ts';
import { getGachaExchangePointIdBySeriesIdFromDatabase } from '../../master-data/gacha-guarantee-master.ts';
import { getGachaSeriesProvenance } from '../../master-data/gacha-series-identity.ts';
import { getGachaSeriesAdminSummaryFromDatabase } from '../../master-data/gacha-series-master.ts';
import { jstGameDate } from '../../master-data/master-time.ts';
import { createGachaAutomaticPurchasePlan } from '../../state/gacha-automatic-purchase-state.ts';
import { executeGachaPurchase } from '../../state/gacha-purchase-execution.ts';
import {
	consumeGachaPurchasePlan,
	peekGachaPurchasePlan,
} from '../../state/gacha-purchase-state.ts';
import {
	canPurchasePaidOnlyGacha,
	recordPaidOnlyGachaPurchase,
} from '../../state/gacha-series-progress-state.ts';
import { canConsumeSisca, consumeSisca } from '../../state/sisca-state.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { readJson } from '../http/read-json.ts';
import { createGachaPurchaseResponse } from '../responses/gacha-response.ts';
import { getGachaPurchaseMasterReleaseSession } from './gacha-purchase-master-release-session.ts';
import { parseGachaPurchaseRequest } from './gacha-purchase-request.ts';
import { runGachaPurchaseRewardTransaction } from './gacha-purchase-reward-transaction.ts';
import { getRequestUser, persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function handleGachaPurchase(
	c: Context,
	routeContext: StateRouteContext,
): Promise<Response> {
	const { defaultHeaders, state, userCardGetList } = routeContext;
	const body = await readJson(c.req.raw);
	const { gachaSeriesId, gachaSetPurchaseType } =
		parseGachaPurchaseRequest(body);
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) {
		return user;
	}
	const session = getGachaPurchaseMasterReleaseSession(
		c,
		routeContext,
		user,
		gachaSeriesId,
	);
	if (session instanceof Response) return session;
	const {
		database: masterDatabase,
		sourceMasterReleaseId,
		userGacha,
	} = session;
	const gachaSeriesSummaries = getActiveGachaSeriesAdminSummary(
		getGachaSeriesAdminSummaryFromDatabase(masterDatabase),
		state.gachaSeriesActivations,
	);
	const gachaSeriesSummary =
		gachaSeriesId === undefined
			? undefined
			: gachaSeriesSummaries.find(
					(summary) => summary.gachaSeriesId === gachaSeriesId,
				);
	if (gachaSeriesSummary === undefined) {
		return routeContext.respondError(c, 'gachaSeriesRequired');
	}
	const gachaSeriesProvenance = getGachaSeriesProvenance(
		masterDatabase,
		sourceMasterReleaseId,
		gachaSeriesSummary.gachaSeriesId,
	);
	if (gachaSeriesProvenance === undefined) {
		return routeContext.respondError(c, 'gachaSeriesRequired');
	}
	if (gachaSetPurchaseType === undefined) {
		return routeContext.respondError(c, 'gachaPurchaseTypeRequired');
	}
	const purchaseCost = getGachaPurchaseCostBySeriesIdFromDatabase(
		masterDatabase,
		gachaSeriesSummary.gachaSeriesId,
		gachaSetPurchaseType,
	);
	if (purchaseCost === undefined) {
		return routeContext.respondError(c, 'gachaPurchaseCostNotFound');
	}
	const gameDate = jstGameDate(routeContext.date.currentDate());
	if (
		purchaseCost.isPaidOnly &&
		!canPurchasePaidOnlyGacha(
			userGacha,
			gachaSeriesSummary.gachaSeriesId,
			gameDate,
			gachaSeriesProvenance,
		)
	) {
		return routeContext.respondError(c, 'gachaPaidOnlyPurchaseLimitReached');
	}
	const purchasePlan = peekGachaPurchasePlan(
		userGacha,
		gachaSeriesSummary.gachaSeriesId,
		purchaseCost.resultCount,
	);
	const resolvedPurchasePlan =
		purchasePlan ??
		createGachaAutomaticPurchasePlan(
			getGachaDrawRatesBySeriesIdFromDatabase(
				masterDatabase,
				gachaSeriesSummary.gachaSeriesId,
			),
			purchaseCost.resultCount,
		);
	const allowedCardIds = new Set(gachaSeriesSummary.cardList);
	if (
		resolvedPurchasePlan === undefined ||
		resolvedPurchasePlan.cardDatasIds.some(
			(cardDatasId) => !allowedCardIds.has(cardDatasId),
		)
	) {
		return routeContext.respondError(c, 'gachaPurchaseDrawRateNotFound');
	}
	const userStatus = routeContext.resolveUserStatus(c, user);
	if (
		!canConsumeSisca(
			state,
			user,
			purchaseCost.price,
			purchaseCost.isPaidOnly,
			userStatus,
		)
	) {
		return routeContext.respondError(c, 'gachaPurchaseSiscaInsufficient');
	}
	const userCards = ensureUserCards(
		state,
		user.playerId,
		userCardGetList,
	).value;
	const purchaseResult = runGachaPurchaseRewardTransaction({
		applyReceipt: () =>
			executeGachaPurchase(
				userGacha,
				userCards,
				(cardDatasId) =>
					getCardDetailTemplateByCardDatasIdFromDatabase(
						masterDatabase,
						cardDatasId,
					),
				(cardDatasId) => {
					const identityFingerprint = getCardIdentityFingerprint(
						masterDatabase,
						cardDatasId,
					);
					return identityFingerprint === undefined
						? undefined
						: { sourceMasterReleaseId, identityFingerprint };
				},
				gachaSeriesSummary.gachaSeriesId,
				gachaSeriesProvenance,
				purchaseCost.resultCount,
				resolvedPurchasePlan,
				getGachaExchangePointIdBySeriesIdFromDatabase(
					masterDatabase,
					gachaSeriesSummary.gachaSeriesId,
				),
				(cardDatasId) =>
					getDuplicateCardRewardFromDatabase(masterDatabase, cardDatasId),
				{ price: purchaseCost.price, type: gachaSetPurchaseType },
			),
		consumeCost: () =>
			consumeSisca(
				state,
				user,
				purchaseCost.price,
				purchaseCost.isPaidOnly,
				userStatus,
			),
		...(purchaseCost.isPaidOnly
			? {
					recordPaidOnlyProgress: () =>
						recordPaidOnlyGachaPurchase(
							userGacha,
							gachaSeriesSummary.gachaSeriesId,
							gameDate,
							gachaSeriesProvenance,
						),
				}
			: {}),
		...(purchasePlan === undefined
			? {}
			: {
					consumeStoredPlan: () =>
						consumeGachaPurchasePlan(
							userGacha,
							gachaSeriesSummary.gachaSeriesId,
							purchaseCost.resultCount,
						),
				}),
	});
	if (!purchaseResult) {
		return routeContext.respondError(c, 'gachaPurchaseDrawRateNotFound');
	}
	persistRouteState(routeContext);
	routeContext.applyResponseHeaders(c, defaultHeaders, { user });
	return c.json(
		createGachaPurchaseResponse(
			userGacha,
			purchaseResult,
			gachaSeriesSummaries,
			gameDate,
			(gachaSeriesId) =>
				getGachaSeriesProvenance(
					masterDatabase,
					sourceMasterReleaseId,
					gachaSeriesId,
				),
		),
	);
}
