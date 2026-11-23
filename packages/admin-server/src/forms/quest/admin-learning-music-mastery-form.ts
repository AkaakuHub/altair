import type { Database } from 'bun:sqlite';
import { musicLevelForEarnedExperienceFromDatabase } from '../../../../../src/master-data/music-levels.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { updateUserLearningMusicMastery } from '../../../../../src/state/user-live-admin-progress-state.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormBoolean,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateLearningMusicMasteryFromForm(
	form: AdminForm,
	state: ServerState,
	database: Database,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const musicId = getAdminPositiveId(form, 'musicId');
	const musicExpLevel = getAdminBoundedInteger(form, 'musicExpLevel', 0, 50);
	const earnedMusicExp = getAdminBoundedInteger(
		form,
		'earnedMusicExp',
		0,
		999_999_999,
	);
	if (
		playerId.length === 0 ||
		musicId === undefined ||
		musicExpLevel === undefined ||
		earnedMusicExp === undefined
	)
		return false;
	const isMastery = getFormBoolean(form, 'isMastery');
	const normalizedEarnedMusicExp = isMastery ? earnedMusicExp : 0;
	const normalizedMusicExpLevel = isMastery
		? musicLevelForEarnedExperienceFromDatabase(
				database,
				normalizedEarnedMusicExp,
			)
		: 0;
	return updateUserLearningMusicMastery(
		state,
		playerId,
		musicId,
		normalizedMusicExpLevel,
		normalizedEarnedMusicExp,
		isMastery,
	);
}
