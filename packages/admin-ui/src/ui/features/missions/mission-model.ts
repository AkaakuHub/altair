import type {
	BeginnerMissionEntry,
	MissionCatalogEntry,
} from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type {
	AdminBeginnerMissionProgress,
	AdminUserBeginnerMission,
	AdminUserChapter,
	AdminUserMission,
	AdminUserStepUpBeginnerMission,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { findPlayerState } from '../player-state.ts';

const schoolStageStarTransitionId = 101;
const dailyMissionType = 1;

export type MissionForm = {
	missionId: number;
	achievedNum: string;
	isAchieved: boolean;
};

export type BeginnerMissionForm = {
	missionId: number;
	achievedNum: string;
	status: 0 | 1 | 2;
};

export type ChapterMissionForm = {
	missionId: string;
	achievedNum: string;
	isAchieved: boolean;
	isReceived: boolean;
};

type ChapterMissionDraft = {
	sourceId: string;
	form: ChapterMissionForm;
};

export type StepUpBeginnerMissionForm = {
	missionId: number;
	achievedNum: string;
	isAchieved: boolean;
	isReceived: boolean;
};

type MissionProgressEntry = AdminUserMission['missionProgresses'][number];

export function getMissionCatalog(
	data: AdminStateResponse,
): MissionCatalogEntry[] {
	return data.seed.missionGroups.flatMap((group) => group.missionList);
}

export function getDailyMissionCatalog(
	data: AdminStateResponse,
): MissionCatalogEntry[] {
	return data.seed.missionGroups
		.filter((group) => group.missionType === dailyMissionType)
		.flatMap((group) => group.missionList);
}

export function getBeginnerMissionCatalog(
	data: AdminStateResponse,
): BeginnerMissionEntry[] {
	return data.seed.beginnerMissionCategories.flatMap(
		(category) => category.missionList,
	);
}

export function getStepUpBeginnerMissionCatalog(
	data: AdminStateResponse,
	activeMission: AdminUserStepUpBeginnerMission | undefined,
): Array<{ missionId: number }> {
	return (
		activeMission?.stepUpMissionList.map((mission) => ({
			missionId: mission.missionId,
		})) ?? data.seed.stepUpBeginnerMissionList
	);
}

export function isDerivedMission(
	missionCatalog: readonly MissionCatalogEntry[],
	missionId: number,
): boolean {
	return (
		missionCatalog.find((mission) => mission.missionId === missionId)
			?.transitionContentsId === schoolStageStarTransitionId
	);
}

export function findActiveMission(
	data: AdminStateResponse,
	playerId: string,
): AdminUserMission | undefined {
	return findPlayerState(data.state.userMissions, playerId);
}

export function findActiveBeginnerMission(
	data: AdminStateResponse,
	playerId: string,
): AdminUserBeginnerMission | undefined {
	return findPlayerState(data.state.userBeginnerMissions, playerId);
}

export function findActiveStepUpBeginnerMission(
	data: AdminStateResponse,
	playerId: string,
): AdminUserStepUpBeginnerMission | undefined {
	return findPlayerState(data.state.userStepUpBeginnerMissions, playerId);
}

export function findActiveChapter(
	data: AdminStateResponse,
	playerId: string,
): AdminUserChapter | undefined {
	return findPlayerState(data.state.userChapters, playerId);
}

export function createChapterMissionDraft(
	chapter: Pick<AdminUserChapter, 'missionProgresses'> | undefined,
	sourceId: string,
): ChapterMissionDraft {
	const progress = chapter?.missionProgresses.find(
		(entry) => entry.missionId === Number(sourceId),
	);
	return {
		sourceId,
		form: {
			missionId: sourceId,
			achievedNum: String(progress?.achievedNum ?? 0),
			isAchieved: progress?.isAchieved ?? false,
			isReceived: progress?.isReceived ?? false,
		},
	};
}

export function createMissionForm(
	userMission: AdminUserMission | undefined,
	missionId: number,
): MissionForm {
	const mission = findMissionProgress(userMission, missionId);
	return {
		missionId,
		achievedNum: String(mission?.achievedNum ?? 0),
		isAchieved: mission?.isAchieved ?? false,
	};
}

export function findMissionProgress(
	userMission: AdminUserMission | undefined,
	missionId: number,
): MissionProgressEntry | undefined {
	return userMission?.missionProgresses.find(
		(mission) => mission.missionId === missionId,
	);
}

export function createBeginnerMissionForm(
	userBeginnerMission: AdminUserBeginnerMission | undefined,
	missionId: number,
): BeginnerMissionForm {
	const progress = findBeginnerMissionProgress(userBeginnerMission, missionId);
	return {
		missionId,
		achievedNum: String(progress?.achievedNum ?? 0),
		status: progress?.status ?? 0,
	};
}

export function findBeginnerMissionProgress(
	userBeginnerMission: AdminUserBeginnerMission | undefined,
	missionId: number,
): AdminBeginnerMissionProgress | undefined {
	return userBeginnerMission?.missionProgresses.find(
		(progress) => progress.missionId === missionId,
	);
}

export function createStepUpBeginnerMissionForm(
	userMission: AdminUserStepUpBeginnerMission | undefined,
	missionId: number,
): StepUpBeginnerMissionForm {
	const mission = findStepUpBeginnerMission(userMission, missionId);
	return {
		missionId,
		achievedNum: String(mission?.achievedNum ?? 0),
		isAchieved: mission?.isAchieved ?? false,
		isReceived: mission?.isReceived ?? false,
	};
}

export function findStepUpBeginnerMission(
	userMission: AdminUserStepUpBeginnerMission | undefined,
	missionId: number,
): AdminUserStepUpBeginnerMission['stepUpMissionList'][number] | undefined {
	return userMission?.stepUpMissionList.find(
		(mission) => mission.missionId === missionId,
	);
}

export function readBeginnerMissionStatus(value: number): 0 | 1 | 2 {
	if (value === 1 || value === 2) {
		return value;
	}
	return 0;
}
