import {
	type GachaSeriesActivationState,
	getEnabledGachaSeriesIds,
} from '../state/gacha-activation-state.ts';

export type GachaUnreadableType = 0 | 1 | 2;

export type ActiveGachaHeaderState = {
	hasActiveGacha: boolean;
	hasPartyGacha: boolean;
	newGachaUnreadableType: GachaUnreadableType;
};

type GachaSeriesAvailability = {
	gachaSeriesId: number;
	isPartyGacha: boolean;
};

export function getActiveGachaSeriesAdminSummary<
	TSeries extends GachaSeriesAvailability,
>(
	seriesList: readonly TSeries[],
	activations: readonly GachaSeriesActivationState[],
): TSeries[] {
	const enabledGachaSeriesIds = getEnabledGachaSeriesIds(activations);
	return seriesList.filter((series) =>
		enabledGachaSeriesIds.has(series.gachaSeriesId),
	);
}

export function getActiveGachaHeaderState(
	seriesList: ReadonlyArray<GachaSeriesAvailability>,
	activations: readonly GachaSeriesActivationState[],
): ActiveGachaHeaderState {
	const activeSeries = getActiveGachaSeriesAdminSummary(
		seriesList,
		activations,
	);
	const hasPartyGacha = activeSeries.some((series) => series.isPartyGacha);
	return {
		hasActiveGacha: activeSeries.length > 0,
		hasPartyGacha,
		newGachaUnreadableType: toGachaUnreadableType(
			activeSeries.length > 0,
			hasPartyGacha,
		),
	};
}

function toGachaUnreadableType(
	hasActiveGacha: boolean,
	hasPartyGacha: boolean,
): GachaUnreadableType {
	if (!hasActiveGacha) {
		return 0;
	}
	return hasPartyGacha ? 2 : 1;
}
