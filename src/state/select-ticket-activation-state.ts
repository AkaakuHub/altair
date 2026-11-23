import { isRecord } from './json-state-utils.ts';

export type SelectTicketSeriesActivationState = {
	selectTicketSeriesId: number;
	isEnabled: boolean;
};

export function setSelectTicketSeriesActivation(
	activations: SelectTicketSeriesActivationState[],
	selectTicketSeriesId: number,
	isEnabled: boolean,
): SelectTicketSeriesActivationState[] {
	if (
		!Number.isSafeInteger(selectTicketSeriesId) ||
		selectTicketSeriesId <= 0
	) {
		return activations;
	}
	const nextActivation = { selectTicketSeriesId, isEnabled };
	const existingIndex = activations.findIndex(
		(activation) => activation.selectTicketSeriesId === selectTicketSeriesId,
	);
	if (existingIndex < 0) {
		return [...activations, nextActivation];
	}
	return activations.map((activation, index) =>
		index === existingIndex ? nextActivation : activation,
	);
}

export function getEnabledSelectTicketSeriesIds(
	activations: readonly SelectTicketSeriesActivationState[],
): Set<number> {
	return new Set(
		activations
			.filter((activation) => activation.isEnabled)
			.map((activation) => activation.selectTicketSeriesId),
	);
}

export function isSelectTicketSeriesActivationState(
	value: unknown,
): value is SelectTicketSeriesActivationState {
	return (
		isRecord(value) &&
		typeof value.selectTicketSeriesId === 'number' &&
		typeof value.isEnabled === 'boolean'
	);
}
