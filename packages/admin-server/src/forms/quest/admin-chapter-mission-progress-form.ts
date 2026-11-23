import type { Database } from 'bun:sqlite';
import { getChapterProvenance } from '../../../../../src/master-data/chapter-identity.ts';
import { getActiveChapterMasterFromDatabase } from '../../../../../src/master-data/chapter-master-data.ts';
import { ensureChapterRuntimeState } from '../../../../../src/server-state.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { ensureUserChapterState } from '../../../../../src/state/chapter-aggregate-state.ts';
import { setChapterMissionProgress } from '../../../../../src/state/chapter-progress-state.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormBoolean,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateChapterMissionProgressFromForm(
	form: AdminForm,
	state: ServerState,
	database: Database,
	masterReleaseId: string,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const missionId = getAdminPositiveId(form, 'missionId');
	const achievedNum = getAdminBoundedInteger(
		form,
		'achievedNum',
		0,
		999_999_999,
	);
	if (
		playerId.length === 0 ||
		missionId === undefined ||
		achievedNum === undefined
	)
		return false;
	const master = getActiveChapterMasterFromDatabase(
		database,
		ensureChapterRuntimeState(state),
	);
	const provenance = getChapterProvenance(
		database,
		masterReleaseId,
		master.chapterId,
	);
	if (provenance === undefined) return false;
	const result = ensureUserChapterState(
		state.userChapters,
		playerId,
		master,
		provenance,
	);
	state.userChapters = result.chapters;
	return setChapterMissionProgress(
		result.chapter,
		missionId,
		achievedNum,
		getFormBoolean(form, 'isAchieved'),
		getFormBoolean(form, 'isReceived'),
	);
}
