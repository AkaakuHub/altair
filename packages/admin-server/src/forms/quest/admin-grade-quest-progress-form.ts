import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { updateUserGradeQuestProgress } from '../../../../../src/state/user-live-admin-progress-state.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormBoolean,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateGradeQuestProgressFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const seriesId = getAdminPositiveId(form, 'seriesId');
	const clearStatus = getAdminBoundedInteger(form, 'clearStatus', 0, 3);
	if (
		playerId.length === 0 ||
		seriesId === undefined ||
		clearStatus === undefined
	)
		return false;
	return updateUserGradeQuestProgress(
		state,
		playerId,
		seriesId,
		clearStatus,
		getFormBoolean(form, 'bonusCleared'),
	);
}
