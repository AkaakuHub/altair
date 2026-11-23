import type { Database } from 'bun:sqlite';
import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import { getActiveGachaSeriesAdminSummary } from '../../../../../src/application/gacha-availability-service.ts';
import { getGachaDrawRatesBySeriesIdFromDatabase } from '../../../../../src/master-data/gacha-draw-master.ts';
import { hasOfficialGachaCardRewardFromDatabase } from '../../../../../src/master-data/gacha-duplicate-card-reward.ts';
import { getGachaSeriesProvenance } from '../../../../../src/master-data/gacha-series-identity.ts';
import { getGachaSeriesAdminSummaryFromDatabase } from '../../../../../src/master-data/gacha-series-master.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { ensureUserGachaState } from '../../../../../src/state/gacha-aggregate-state.ts';
import { createGachaAutomaticPurchasePlan } from '../../../../../src/state/gacha-automatic-purchase-state.ts';
import { setGachaGuaranteeExchangeItem } from '../../../../../src/state/gacha-guarantee-exchange-state.ts';
import type { GachaGuaranteeExchangeItemState } from '../../../../../src/state/gacha-guarantee-types.ts';
import {
	deleteGachaPurchasePlan,
	setGachaPurchasePlan,
} from '../../../../../src/state/gacha-purchase-state.ts';
import { setGachaSeriesProgress } from '../../../../../src/state/gacha-series-progress-state.ts';
import type { JsonObject } from '../../../../../src/state/json-state-utils.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormBoolean,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateGachaSeriesProgressFromForm(
	form: AdminForm,
	state: ServerState,
	database: Database,
	masterReleaseId: string,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const gachaSeriesId = getAdminPositiveId(form, 'gachaSeriesId');
	const exchangePoint = getAdminBoundedInteger(
		form,
		'userExchangePointNum',
		0,
		MAX_ADMIN_ITEM_QUANTITY,
	);
	const execCount = getAdminBoundedInteger(
		form,
		'userSeriesExecCount',
		0,
		MAX_ADMIN_ITEM_QUANTITY,
	);
	if (
		playerId.length === 0 ||
		gachaSeriesId === undefined ||
		exchangePoint === undefined ||
		execCount === undefined
	)
		return false;
	const provenance = getGachaSeriesProvenance(
		database,
		masterReleaseId,
		gachaSeriesId,
	);
	return (
		provenance !== undefined &&
		setGachaSeriesProgress(
			ensureUserGachaState(state, playerId).value,
			gachaSeriesId,
			exchangePoint,
			execCount,
			provenance,
		)
	);
}

export function updateGachaPurchasePlanFromForm(
	form: AdminForm,
	state: ServerState,
	database: Database,
	masterReleaseId: string,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const gachaSeriesId = getAdminPositiveId(form, 'gachaSeriesId');
	const resultCount = getAdminBoundedInteger(form, 'resultCount', 1, 10);
	const cardDatasIds =
		resultCount === undefined
			? []
			: readGachaPurchasePlanCardDatasIds(form, resultCount);
	if (
		playerId.length === 0 ||
		gachaSeriesId === undefined ||
		resultCount === undefined ||
		cardDatasIds.length !== resultCount
	)
		return false;
	const activeSeries = getActiveGachaSeriesAdminSummary(
		getGachaSeriesAdminSummaryFromDatabase(database),
		state.gachaSeriesActivations,
	).find((series) => series.gachaSeriesId === gachaSeriesId);
	const targetCardIds = new Set(activeSeries?.cardList ?? []);
	if (
		targetCardIds.size === 0 ||
		cardDatasIds.some(
			(cardDatasId) =>
				!targetCardIds.has(cardDatasId) ||
				!hasOfficialGachaCardRewardFromDatabase(database, cardDatasId),
		)
	)
		return false;
	const userGacha = ensureUserGachaState(state, playerId).value;
	const bonusResults = createGachaPurchasePlanBonusResults(
		database,
		gachaSeriesId,
		cardDatasIds.length,
	);
	if (bonusResults === undefined) return false;
	return setGachaPurchasePlan(
		userGacha,
		gachaSeriesId,
		masterReleaseId,
		cardDatasIds,
		bonusResults,
	);
}

export function deleteGachaPurchasePlanFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const gachaSeriesId = getAdminPositiveId(form, 'gachaSeriesId');
	if (playerId.length === 0 || gachaSeriesId === undefined) return false;
	return deleteGachaPurchasePlan(
		ensureUserGachaState(state, playerId).value,
		gachaSeriesId,
	);
}

export function updateGachaGuaranteeFromForm(
	form: AdminForm,
	state: ServerState,
	guaranteeExchangeItemList: GachaGuaranteeExchangeItemState[],
): boolean {
	const playerId = getFormString(form, 'playerId');
	const exchangePointRateId = getAdminPositiveId(form, 'exchangePointRateId');
	const remainingExchangeNum = getAdminBoundedInteger(
		form,
		'remainingExchangeNum',
		-1,
		MAX_ADMIN_ITEM_QUANTITY,
	);
	if (
		playerId.length === 0 ||
		exchangePointRateId === undefined ||
		remainingExchangeNum === undefined
	)
		return false;
	const userGacha = ensureUserGachaState(state, playerId).value;
	if (
		!guaranteeExchangeItemList.some(
			(item) => item.exchangePointRateId === exchangePointRateId,
		)
	)
		return false;
	return setGachaGuaranteeExchangeItem(
		userGacha,
		exchangePointRateId,
		getFormBoolean(form, 'isHaving'),
		remainingExchangeNum,
	);
}

export function readGachaPurchasePlanCardDatasIds(
	form: AdminForm,
	resultCount: number,
): number[] {
	return Array.from({ length: resultCount }, (_, index) =>
		getAdminPositiveId(form, `cardDatasId${index + 1}`),
	).filter((id): id is number => id !== undefined);
}

function createGachaPurchasePlanBonusResults(
	database: Database,
	gachaSeriesId: number,
	resultCount: number,
): JsonObject[] | undefined {
	const drawRates = getGachaDrawRatesBySeriesIdFromDatabase(
		database,
		gachaSeriesId,
	);
	if (drawRates.length === 0) return undefined;
	if (drawRates.every((drawRate) => drawRate.isGiftless)) return [];
	return createGachaAutomaticPurchasePlan(drawRates, resultCount)?.bonusResults;
}
