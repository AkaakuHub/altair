import type { BeginnerMissionCategoryMaster } from './beginner-mission-master.ts';
import type {
	BeginnerMissionProgressState,
	UserBeginnerMissionState,
} from './beginner-mission-types.ts';

const initialBeginnerMissionProgresses: readonly BeginnerMissionProgressState[] =
	[
		{ missionId: 900202, achievedNum: 1, status: 1 },
		{ missionId: 900210, achievedNum: 1, status: 0 },
		{ missionId: 900301, achievedNum: 1, status: 1 },
		{ missionId: 900302, achievedNum: 1, status: 1 },
		{ missionId: 900303, achievedNum: 1, status: 1 },
		{ missionId: 900304, achievedNum: 1, status: 1 },
	];

export function ensureUserBeginnerMissionState(
	missions: UserBeginnerMissionState[],
	playerId: string,
	missionCategories: readonly BeginnerMissionCategoryMaster[],
): { missions: UserBeginnerMissionState[]; mission: UserBeginnerMissionState } {
	const existing = missions.find((mission) => mission.playerId === playerId);
	if (existing) return { missions, mission: existing };
	const mission = createUserBeginnerMissionState(playerId, missionCategories);
	return { missions: [...missions, mission], mission };
}

function createUserBeginnerMissionState(
	playerId: string,
	missionCategories: readonly BeginnerMissionCategoryMaster[],
): UserBeginnerMissionState {
	return {
		playerId,
		missionProgresses: initialBeginnerMissionProgresses
			.filter((progress) =>
				missionCategories.some((category) =>
					category.missionList.some(
						(entry) => entry.missionId === progress.missionId,
					),
				),
			)
			.map((progress) => ({ ...progress })),
		receivedMissionIds: [],
		receivedMissionTypes: [],
	};
}
