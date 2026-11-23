import type {
	BeginnerMissionProgressState,
	UserBeginnerMissionState,
} from '../../../../../../src/state/beginner-mission-types.ts';
import type {
	MissionProgressState,
	UserMissionState,
} from '../../../../../../src/state/mission-types.ts';
import type {
	StepUpBeginnerMissionProgressState,
	UserStepUpBeginnerMissionState,
} from '../../../../../../src/state/step-up-beginner-mission-state.ts';
import {
	type JsonRecord,
	readBoolean,
	readNumber,
	readRecord,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

export function createMissionsFromResponse(
	playerId: string,
	response: JsonRecord | undefined,
): UserMissionState | null {
	if (response === undefined) {
		return null;
	}
	const missionGroups = readRecordArray(response.mission_list);
	if (missionGroups.length === 0 && !Array.isArray(response.mission_list)) {
		return null;
	}
	const commonMissionInfo = readRecord(response.common_mission_info);
	return {
		playerId,
		commonMissionInfo: {
			receivedOrder: readNumber(commonMissionInfo?.received_order) ?? 0,
			rhythmGameStar: readNumber(commonMissionInfo?.rhythm_game_star) ?? 0,
			schoolStageStar: readNumber(commonMissionInfo?.school_stage_star) ?? 0,
		},
		missionProgresses: missionGroups
			.flatMap((group) => readRecordArray(group.mission_list))
			.map(createMissionProgress)
			.filter(
				(progress): progress is MissionProgressState => progress !== null,
			),
		dailyMissionGameDate: readString(response.daily_mission_game_date),
	};
}

function createMissionProgress(
	mission: JsonRecord,
): MissionProgressState | null {
	const missionId = readNumber(mission.mission_id);
	const achievedNum = readNumber(mission.achieved_num);
	const isAchieved = readBoolean(mission.is_achieved);
	if (missionId === null || achievedNum === null) {
		return null;
	}
	if (achievedNum === 0 && !isAchieved) {
		return null;
	}
	return {
		missionId,
		achievedNum,
		isAchieved,
	};
}

export function createBeginnerMissionsFromResponse(
	playerId: string,
	response: JsonRecord | undefined,
): UserBeginnerMissionState | null {
	if (response === undefined) {
		return null;
	}
	const categories = readRecordArray(response.mission_category_list);
	if (
		categories.length === 0 &&
		!Array.isArray(response.mission_category_list)
	) {
		return null;
	}
	const missionProgresses = categories.flatMap((category) =>
		readRecordArray(category.mission_list)
			.map(createBeginnerMissionProgress)
			.filter(
				(progress): progress is BeginnerMissionProgressState =>
					progress !== null,
			),
	);
	const persistedMissionProgresses = missionProgresses.filter(
		(progress) => progress.achievedNum !== 0 || progress.status !== 0,
	);
	const receivedMissionTypes = categories
		.filter((category) => readBoolean(category.is_received))
		.map((category) => readNumber(category.mission_type))
		.filter((missionType): missionType is number => missionType !== null);
	return {
		playerId,
		missionProgresses: persistedMissionProgresses,
		receivedMissionIds: persistedMissionProgresses
			.filter((progress) => progress.status === 2)
			.map((progress) => progress.missionId),
		receivedMissionTypes,
	};
}

function createBeginnerMissionProgress(
	progress: JsonRecord,
): BeginnerMissionProgressState | null {
	const missionId = readNumber(progress.mission_id);
	const achievedNum = readNumber(progress.achieved_num);
	const status = readNumber(progress.status);
	if (
		missionId === null ||
		achievedNum === null ||
		(status !== 0 && status !== 1 && status !== 2)
	) {
		return null;
	}
	return { missionId, achievedNum, status };
}

export function createStepUpBeginnerMissionsFromResponse(
	playerId: string,
	response: JsonRecord | undefined,
): UserStepUpBeginnerMissionState | null {
	if (response === undefined) {
		return null;
	}
	const stepUpMissionList = readRecordArray(response.step_up_mission_list)
		.map(createStepUpBeginnerMissionProgress)
		.filter(
			(progress): progress is StepUpBeginnerMissionProgressState =>
				progress !== null,
		);
	if (
		stepUpMissionList.length === 0 &&
		!Array.isArray(response.step_up_mission_list)
	) {
		return null;
	}
	return { playerId, stepUpMissionList };
}

function createStepUpBeginnerMissionProgress(
	progress: JsonRecord,
): StepUpBeginnerMissionProgressState | null {
	const missionId = readNumber(progress.mission_id);
	const achievedNum = readNumber(progress.achieved_num);
	if (missionId === null || achievedNum === null) {
		return null;
	}
	return {
		missionId,
		achievedNum,
		isAchieved: readBoolean(progress.is_achieved),
		isReceived: readBoolean(progress.is_received),
	};
}
