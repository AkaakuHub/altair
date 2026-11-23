import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { updateUserGrandPrixStageProgress } from '../../../../../src/state/user-live-admin-progress-state.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateGrandPrixStageProgressFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const grandPrixId = getAdminPositiveId(form, 'grandPrixId');
	const stageId = getAdminPositiveId(form, 'stageId');
	const highScore = getAdminBoundedInteger(form, 'highScore', 0, 999_999_999);
	const dailyBestScore = getAdminBoundedInteger(
		form,
		'dailyBestScore',
		0,
		999_999_999,
	);
	const playCount = getAdminBoundedInteger(form, 'playCount', 0, 999_999);
	if (
		playerId.length === 0 ||
		grandPrixId === undefined ||
		stageId === undefined ||
		highScore === undefined ||
		dailyBestScore === undefined ||
		playCount === undefined
	)
		return false;
	return updateUserGrandPrixStageProgress(
		state,
		playerId,
		grandPrixId,
		stageId,
		highScore,
		dailyBestScore,
		playCount,
	);
}
