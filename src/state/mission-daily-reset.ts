import { isSameEntityIdentity } from './entity-provenance.ts';
import type { MissionGroupMaster } from './mission-master.ts';
import type { UserMissionState } from './mission-types.ts';

export function resetDailyMissionProgressForGameDate(
	mission: UserMissionState,
	missionGroups: readonly MissionGroupMaster[],
	gameDate: string,
): boolean {
	if (gameDate.length === 0 || mission.dailyMissionGameDate === gameDate)
		return false;
	mission.dailyMissionGameDate = gameDate;
	const dailyMissions = missionGroups
		.filter((group) => group.missionType === 1)
		.flatMap((group) => group.missionList);
	const fingerprints = new Map(
		dailyMissions.flatMap((entry) =>
			entry.identityFingerprint === undefined
				? []
				: [[entry.missionId, entry.identityFingerprint] as const],
		),
	);
	const legacyIds = new Set(
		dailyMissions
			.filter((entry) => entry.identityFingerprint === undefined)
			.map((entry) => entry.missionId),
	);
	mission.missionProgresses = mission.missionProgresses.filter((progress) => {
		if (legacyIds.has(progress.missionId)) return false;
		const target = fingerprints.get(progress.missionId);
		return (
			target === undefined ||
			(progress.identityFingerprint !== undefined &&
				!isSameEntityIdentity(progress.identityFingerprint, target))
		);
	});
	return true;
}
