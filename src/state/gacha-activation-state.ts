import { isRecord } from './json-state-utils.ts';

export type GachaSeriesActivationState = {
	gachaSeriesId: number;
	isEnabled: boolean;
};

export function createInitialGachaSeriesActivations(
	gachaSeriesIds: readonly number[],
): GachaSeriesActivationState[] {
	return gachaSeriesIds.map((gachaSeriesId) => ({
		gachaSeriesId,
		isEnabled: true,
	}));
}

export function setGachaSeriesActivation(
	activations: GachaSeriesActivationState[],
	gachaSeriesId: number,
	isEnabled: boolean,
): GachaSeriesActivationState[] {
	if (!Number.isSafeInteger(gachaSeriesId) || gachaSeriesId <= 0) {
		return activations;
	}
	const nextActivation = { gachaSeriesId, isEnabled };
	const existingIndex = activations.findIndex(
		(activation) => activation.gachaSeriesId === gachaSeriesId,
	);
	if (existingIndex === -1) {
		return [...activations, nextActivation].sort(
			(left, right) => left.gachaSeriesId - right.gachaSeriesId,
		);
	}
	return activations.map((activation, index) =>
		index === existingIndex ? nextActivation : activation,
	);
}

export function getEnabledGachaSeriesIds(
	activations: readonly GachaSeriesActivationState[],
): Set<number> {
	return new Set(
		activations
			.filter((activation) => activation.isEnabled)
			.map((activation) => activation.gachaSeriesId),
	);
}

export function isGachaSeriesActivationState(
	value: unknown,
): value is GachaSeriesActivationState {
	return (
		isRecord(value) &&
		typeof value.gachaSeriesId === 'number' &&
		typeof value.isEnabled === 'boolean'
	);
}
