import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { setGachaSeriesActivation } from '../../../../../src/state/gacha-activation-state.ts';
import { setSelectTicketSeriesActivation } from '../../../../../src/state/select-ticket-activation-state.ts';
import { parseAdminActivationEntries } from '../shared/admin-activation-form-parser.ts';
import { type AdminForm, getFormString } from '../shared/admin-form-values.ts';

export function updateGachaSeriesActivationsFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const activations = parseGachaSeriesActivationList(
		getFormString(form, 'activations'),
	);
	if (activations === undefined) {
		return false;
	}
	for (const activation of activations) {
		state.gachaSeriesActivations = setGachaSeriesActivation(
			state.gachaSeriesActivations,
			activation.gachaSeriesId,
			activation.isEnabled,
		);
	}
	return true;
}

export function updateSelectTicketSeriesActivationsFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const activations = parseSelectTicketSeriesActivationList(
		getFormString(form, 'activations'),
	);
	if (activations === undefined) {
		return false;
	}
	for (const activation of activations) {
		state.selectTicketSeriesActivations = setSelectTicketSeriesActivation(
			state.selectTicketSeriesActivations,
			activation.selectTicketSeriesId,
			activation.isEnabled,
		);
	}
	return true;
}

type GachaSeriesActivationFormValue = {
	gachaSeriesId: number;
	isEnabled: boolean;
};

type SelectTicketSeriesActivationFormValue = {
	selectTicketSeriesId: number;
	isEnabled: boolean;
};

function parseGachaSeriesActivationList(
	value: string,
): GachaSeriesActivationFormValue[] | undefined {
	const activations = parseAdminActivationEntries(value, 'gachaSeriesId');
	if (activations === undefined) {
		return undefined;
	}
	return activations.map(({ id, isEnabled }) => ({
		gachaSeriesId: id,
		isEnabled,
	}));
}

function parseSelectTicketSeriesActivationList(
	value: string,
): SelectTicketSeriesActivationFormValue[] | undefined {
	const activations = parseAdminActivationEntries(
		value,
		'selectTicketSeriesId',
	);
	if (activations === undefined) {
		return undefined;
	}
	return activations.map(({ id, isEnabled }) => ({
		selectTicketSeriesId: id,
		isEnabled,
	}));
}
