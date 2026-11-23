import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { updateUserDreamLiveProgress } from '../../../../../src/state/user-live-admin-progress-state.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormBoolean,
	getFormString,
} from '../shared/admin-form-values.ts';

interface DreamLiveProgressFormValue {
	playerId: string;
	stageId: number;
	clearTimes: number;
	isGetCard: boolean;
	limitBreakTimes: number;
}

export function readDreamLiveProgressForm(
	form: AdminForm,
): DreamLiveProgressFormValue | undefined {
	const playerId = getFormString(form, 'playerId');
	const stageId = getAdminPositiveId(form, 'stageId');
	const clearTimes = getAdminBoundedInteger(form, 'clearTimes', 0, 999_999);
	const limitBreakTimes = getAdminBoundedInteger(
		form,
		'limitBreakTimes',
		0,
		999,
	);
	if (
		playerId.length === 0 ||
		stageId === undefined ||
		clearTimes === undefined ||
		limitBreakTimes === undefined
	)
		return undefined;
	return {
		playerId,
		stageId,
		clearTimes,
		isGetCard: getFormBoolean(form, 'isGetCard'),
		limitBreakTimes,
	};
}

export function updateDreamLiveProgressFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const value = readDreamLiveProgressForm(form);
	return value === undefined
		? false
		: updateUserDreamLiveProgress(
				state,
				value.playerId,
				value.stageId,
				value.clearTimes,
				value.isGetCard,
				value.limitBreakTimes,
			);
}
