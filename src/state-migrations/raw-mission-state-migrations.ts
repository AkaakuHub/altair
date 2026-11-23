import { isRecord } from '../state/json-state-utils.ts';

export function migrateRawMissionStates(state: Record<string, unknown>): void {
	if (!Array.isArray(state.userMissions)) return;
	for (const mission of state.userMissions) {
		if (!isRecord(mission)) continue;
		if (Array.isArray(mission.missionProgresses)) {
			mission.missionProgresses = mission.missionProgresses.filter(
				(progress) =>
					isRecord(progress) &&
					typeof progress.achievedNum === 'number' &&
					typeof progress.isAchieved === 'boolean' &&
					(progress.achievedNum !== 0 || progress.isAchieved),
			);
			continue;
		}
		const missionProgresses: Array<{
			missionId: number;
			achievedNum: number;
			isAchieved: boolean;
		}> = [];
		if (Array.isArray(mission.missionGroups)) {
			for (const group of mission.missionGroups) {
				if (!isRecord(group) || !Array.isArray(group.missionList)) continue;
				for (const entry of group.missionList) {
					if (
						!isRecord(entry) ||
						typeof entry.missionId !== 'number' ||
						typeof entry.achievedNum !== 'number' ||
						typeof entry.isAchieved !== 'boolean' ||
						(entry.achievedNum === 0 && !entry.isAchieved)
					)
						continue;
					missionProgresses.push({
						missionId: entry.missionId,
						achievedNum: entry.achievedNum,
						isAchieved: entry.isAchieved,
					});
				}
			}
		}
		mission.missionProgresses = missionProgresses;
		delete mission.missionGroups;
	}
}

export function migrateRawBeginnerMissionStates(
	state: Record<string, unknown>,
): void {
	if (!Array.isArray(state.userBeginnerMissions)) return;
	for (const mission of state.userBeginnerMissions) {
		if (!isRecord(mission) || !Array.isArray(mission.missionProgresses))
			continue;
		mission.missionProgresses = mission.missionProgresses.filter(
			(progress) =>
				isRecord(progress) &&
				typeof progress.achievedNum === 'number' &&
				typeof progress.status === 'number' &&
				(progress.achievedNum !== 0 || progress.status !== 0),
		);
	}
}
