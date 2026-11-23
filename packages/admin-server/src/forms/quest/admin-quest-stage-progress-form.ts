import type { Database } from 'bun:sqlite';
import { createMasterBackedMissionProgressController } from '../../../../../src/mission-progress-controller.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { updateUserQuestStageProgress } from '../../../../../src/state/user-live-admin-progress-state.ts';
import { ensureUserLiveState } from '../../../../../src/state/user-live-state.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateQuestStageProgressFromForm(
	form: AdminForm,
	state: ServerState,
	database: Database,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const questLiveType = getAdminBoundedInteger(form, 'questLiveType', 1, 10);
	const stageId = getAdminPositiveId(form, 'stageId');
	const highScore = getAdminBoundedInteger(form, 'highScore', 0, 999_999_999);
	const playCount = getAdminBoundedInteger(form, 'playCount', 0, 999_999);
	const bestLoveMusicId = getAdminBoundedInteger(
		form,
		'bestLoveMusicId',
		0,
		999_999_999,
	);
	if (
		playerId.length === 0 ||
		questLiveType === undefined ||
		stageId === undefined ||
		highScore === undefined ||
		playCount === undefined ||
		bestLoveMusicId === undefined
	)
		return false;
	const updated = updateUserQuestStageProgress(
		state,
		playerId,
		questLiveType,
		stageId,
		highScore,
		playCount,
		bestLoveMusicId,
	);
	if (updated && questLiveType === 1) {
		createMasterBackedMissionProgressController(
			state,
			database,
		).syncSchoolStageStars(
			playerId,
			ensureUserLiveState(state, playerId).value,
		);
	}
	return updated;
}
