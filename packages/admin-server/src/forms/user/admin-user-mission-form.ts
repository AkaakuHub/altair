import type { Database } from 'bun:sqlite';
import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import { getBeginnerMissionCategoriesFromDatabase } from '../../../../../src/master-data/beginner-mission-master-data.ts';
import { getMissionGroupsFromDatabase } from '../../../../../src/master-data/mission-group-master-repository.ts';
import { getStepUpBeginnerMissionsFromDatabase } from '../../../../../src/master-data/step-up-beginner-mission-master-data.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { ensureUserBeginnerMissionState } from '../../../../../src/state/beginner-mission-aggregate-state.ts';
import { setBeginnerMissionProgress } from '../../../../../src/state/beginner-mission-progress-state.ts';
import { ensureUserMissionState } from '../../../../../src/state/mission-progress-aggregate.ts';
import { setMissionProgress } from '../../../../../src/state/mission-progress-mutation.ts';
import {
	ensureUserStepUpBeginnerMissionState,
	setStepUpBeginnerMissionProgress,
} from '../../../../../src/state/step-up-beginner-mission-state.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormBoolean,
	getFormString,
} from '../shared/admin-form-values.ts';

const schoolStageStarTransitionId = 101;

export function updateBeginnerMissionFromForm(
	form: AdminForm,
	state: ServerState,
	database: Database,
	sourceMasterReleaseId?: string,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const missionId = getAdminPositiveId(form, 'missionId');
	const achievedNum = getAdminBoundedInteger(
		form,
		'achievedNum',
		0,
		MAX_ADMIN_ITEM_QUANTITY,
	);
	const status = getAdminBoundedInteger(form, 'status', 0, 2);
	const missionStatus =
		status === 0 || status === 1 || status === 2 ? status : undefined;
	if (
		playerId.length === 0 ||
		missionId === undefined ||
		achievedNum === undefined ||
		missionStatus === undefined
	)
		return false;
	const result = ensureUserBeginnerMissionState(
		state.userBeginnerMissions,
		playerId,
		getBeginnerMissionCategoriesFromDatabase(database),
	);
	state.userBeginnerMissions = result.missions;
	const target = getBeginnerMissionCategoriesFromDatabase(database)
		.flatMap((category) => category.missionList)
		.find((mission) => mission.missionId === missionId);
	if (target === undefined) return false;
	return setBeginnerMissionProgress(
		result.mission,
		missionId,
		achievedNum,
		missionStatus,
		target.identityFingerprint === undefined ||
			sourceMasterReleaseId === undefined
			? undefined
			: {
					sourceMasterReleaseId,
					identityFingerprint: target.identityFingerprint,
				},
	);
}

export function updateStepUpBeginnerMissionFromForm(
	form: AdminForm,
	state: ServerState,
	database: Database,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const missionId = getAdminPositiveId(form, 'missionId');
	const achievedNum = getAdminBoundedInteger(
		form,
		'achievedNum',
		0,
		MAX_ADMIN_ITEM_QUANTITY,
	);
	if (
		playerId.length === 0 ||
		missionId === undefined ||
		achievedNum === undefined
	)
		return false;
	const mission = ensureUserStepUpBeginnerMissionState(
		state,
		playerId,
		getStepUpBeginnerMissionsFromDatabase(database),
	).value;
	return setStepUpBeginnerMissionProgress(
		mission,
		missionId,
		achievedNum,
		getFormBoolean(form, 'isAchieved'),
		getFormBoolean(form, 'isReceived'),
	);
}

export function updateMissionProgressFromForm(
	form: AdminForm,
	state: ServerState,
	database: Database,
	sourceMasterReleaseId?: string,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const missionId = getAdminPositiveId(form, 'missionId');
	const achievedNum = getAdminBoundedInteger(
		form,
		'achievedNum',
		0,
		MAX_ADMIN_ITEM_QUANTITY,
	);
	if (
		playerId.length === 0 ||
		missionId === undefined ||
		achievedNum === undefined
	)
		return false;
	const target = getMissionGroupsFromDatabase(database)
		.flatMap((group) => group.missionList)
		.find((mission) => mission.missionId === missionId);
	if (
		target === undefined ||
		target.transitionContentsId === schoolStageStarTransitionId
	)
		return false;
	return setMissionProgress(
		ensureUserMissionState(state, playerId),
		missionId,
		achievedNum,
		getFormBoolean(form, 'isAchieved'),
		target.identityFingerprint === undefined ||
			sourceMasterReleaseId === undefined
			? undefined
			: {
					sourceMasterReleaseId,
					identityFingerprint: target.identityFingerprint,
				},
	);
}
