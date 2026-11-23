import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import { isRecord } from './json-state-utils.ts';
import type { StepUpBeginnerMissionMaster } from './step-up-beginner-mission-master.ts';

export type UserStepUpBeginnerMissionState = {
	playerId: string;
	stepUpMissionList: StepUpBeginnerMissionProgressState[];
};

export type StepUpBeginnerMissionProgressState = {
	missionId: number;
	achievedNum: number;
	isAchieved: boolean;
	isReceived: boolean;
};

const initialStepUpBeginnerMissionProgresses: readonly StepUpBeginnerMissionProgressState[] =
	[
		{
			missionId: 94002,
			achievedNum: 1,
			isAchieved: false,
			isReceived: false,
		},
	];

export function ensureUserStepUpBeginnerMissionState(
	state: Pick<ServerState, 'userStepUpBeginnerMissions'>,
	playerId: string,
	stepUpBeginnerMissions: readonly StepUpBeginnerMissionMaster[],
): EnsureStateResult<UserStepUpBeginnerMissionState> {
	const existing = state.userStepUpBeginnerMissions.find(
		(mission) => mission.playerId === playerId,
	);
	if (existing) {
		return { value: existing, created: false };
	}
	const mission = createUserStepUpBeginnerMissionState(
		playerId,
		stepUpBeginnerMissions,
	);
	state.userStepUpBeginnerMissions = [
		...state.userStepUpBeginnerMissions,
		mission,
	];
	return { value: mission, created: true };
}

function createUserStepUpBeginnerMissionState(
	playerId: string,
	stepUpBeginnerMissions: readonly StepUpBeginnerMissionMaster[],
): UserStepUpBeginnerMissionState {
	return {
		playerId,
		stepUpMissionList: createStepUpBeginnerMissionProgresses(
			stepUpBeginnerMissions,
		),
	};
}

export function setStepUpBeginnerMissionProgress(
	mission: UserStepUpBeginnerMissionState,
	missionId: number,
	achievedNum: number,
	isAchieved: boolean,
	isReceived: boolean,
): boolean {
	if (
		!Number.isSafeInteger(missionId) ||
		missionId <= 0 ||
		!Number.isSafeInteger(achievedNum) ||
		achievedNum < 0
	) {
		return false;
	}
	const progress = mission.stepUpMissionList.find(
		(entry) => entry.missionId === missionId,
	);
	if (!progress) {
		return false;
	}
	progress.achievedNum = achievedNum;
	progress.isAchieved = isAchieved;
	progress.isReceived = isReceived;
	return true;
}

export function isUserStepUpBeginnerMissionState(
	value: unknown,
): value is UserStepUpBeginnerMissionState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		Array.isArray(value.stepUpMissionList) &&
		value.stepUpMissionList.every(isStepUpBeginnerMissionProgressState)
	);
}

function createStepUpBeginnerMissionProgresses(
	stepUpBeginnerMissions: readonly StepUpBeginnerMissionMaster[],
): StepUpBeginnerMissionProgressState[] {
	return stepUpBeginnerMissions.map((mission) => {
		const initialProgress = initialStepUpBeginnerMissionProgresses.find(
			(progress) => progress.missionId === mission.missionId,
		);
		return {
			missionId: mission.missionId,
			achievedNum: initialProgress?.achievedNum ?? 0,
			isAchieved: initialProgress?.isAchieved ?? false,
			isReceived: initialProgress?.isReceived ?? false,
		};
	});
}

function isStepUpBeginnerMissionProgressState(
	value: unknown,
): value is StepUpBeginnerMissionProgressState {
	return (
		isRecord(value) &&
		typeof value.missionId === 'number' &&
		typeof value.achievedNum === 'number' &&
		typeof value.isAchieved === 'boolean' &&
		typeof value.isReceived === 'boolean'
	);
}
