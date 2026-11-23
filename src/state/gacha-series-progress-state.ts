import { isSameEntityIdentity } from './entity-provenance.ts';
import type {
	GachaSeriesProgressState,
	GachaSeriesProvenance,
	UserGachaState,
} from './gacha-types.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';

export function findGachaSeriesProgress(
	userGacha: UserGachaState,
	gachaSeriesId: number,
	provenance: GachaSeriesProvenance,
): GachaSeriesProgressState | undefined {
	return findCompatibleMasterBoundProgress(
		userGacha.seriesProgressList,
		(progress) => progress.gachaSeriesId === gachaSeriesId,
		provenance.identityFingerprint,
	);
}

export function ensureGachaSeriesProgress(
	userGacha: UserGachaState,
	gachaSeriesId: number,
	provenance: GachaSeriesProvenance,
): GachaSeriesProgressState {
	const exact = userGacha.seriesProgressList.find(
		(progress) =>
			progress.gachaSeriesId === gachaSeriesId &&
			isSameEntityIdentity(
				progress.identityFingerprint,
				provenance.identityFingerprint,
			),
	);
	if (exact) return exact;
	const legacy = userGacha.seriesProgressList.find(
		(progress) =>
			progress.gachaSeriesId === gachaSeriesId &&
			progress.identityFingerprint === undefined,
	);
	const progress = {
		...provenance,
		gachaSeriesId,
		userExchangePointNum: legacy?.userExchangePointNum ?? 0,
		userSeriesExecCount: legacy?.userSeriesExecCount ?? 0,
	};
	userGacha.seriesProgressList = [...userGacha.seriesProgressList, progress];
	return progress;
}

export function canPurchasePaidOnlyGacha(
	userGacha: UserGachaState,
	gachaSeriesId: number,
	gameDate: string,
	provenance: GachaSeriesProvenance,
): boolean {
	return (
		findCompatibleMasterBoundProgress(
			userGacha.paidOnlyPurchaseList,
			(purchase) =>
				purchase.gachaSeriesId === gachaSeriesId &&
				purchase.gameDate === gameDate,
			provenance.identityFingerprint,
		) === undefined
	);
}

export function recordPaidOnlyGachaPurchase(
	userGacha: UserGachaState,
	gachaSeriesId: number,
	gameDate: string,
	provenance: GachaSeriesProvenance,
): void {
	if (!canPurchasePaidOnlyGacha(userGacha, gachaSeriesId, gameDate, provenance))
		return;
	userGacha.paidOnlyPurchaseList = [
		...userGacha.paidOnlyPurchaseList,
		{ ...provenance, gachaSeriesId, gameDate },
	];
}

export function setGachaSeriesProgress(
	userGacha: UserGachaState,
	gachaSeriesId: number,
	userExchangePointNum: number,
	userSeriesExecCount: number,
	provenance: GachaSeriesProvenance,
): boolean {
	if (
		!isNonNegativeSafeInteger(userExchangePointNum) ||
		!isNonNegativeSafeInteger(userSeriesExecCount) ||
		!Number.isSafeInteger(gachaSeriesId) ||
		gachaSeriesId <= 0
	) {
		return false;
	}
	const progress = ensureGachaSeriesProgress(
		userGacha,
		gachaSeriesId,
		provenance,
	);
	progress.userExchangePointNum = userExchangePointNum;
	progress.userSeriesExecCount = userSeriesExecCount;
	return true;
}

function isNonNegativeSafeInteger(value: number): boolean {
	return Number.isSafeInteger(value) && value >= 0;
}
