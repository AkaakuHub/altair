import type { MissionGroupMaster } from './mission-master.ts';
import {
	getMissionProgress,
	upsertMissionProgress,
} from './mission-progress-aggregate.ts';
import type { UserMissionState } from './mission-types.ts';

export function incrementMissionProgressByTransition(
	mission: UserMissionState,
	missionGroups: readonly MissionGroupMaster[],
	transitionContentsId: number,
	amount: number,
	sourceMasterReleaseId?: string,
): boolean {
	if (
		!Number.isSafeInteger(transitionContentsId) ||
		transitionContentsId <= 0 ||
		!Number.isSafeInteger(amount) ||
		amount <= 0
	)
		return false;
	let updated = false;
	for (const master of matchingMissions(missionGroups, transitionContentsId)) {
		const current = getMissionProgress(
			mission,
			master.missionId,
			master.identityFingerprint,
		);
		const achievedNum = Math.min(
			master.conditionAchieveNum,
			(current?.achievedNum ?? 0) + amount,
		);
		upsertTransitionProgress(
			mission,
			master,
			achievedNum,
			sourceMasterReleaseId,
		);
		updated = true;
	}
	return updated;
}

export function setMissionProgressByTransition(
	mission: UserMissionState,
	missionGroups: readonly MissionGroupMaster[],
	transitionContentsId: number,
	achievedNum: number,
	sourceMasterReleaseId?: string,
): boolean {
	let updated = false;
	for (const master of matchingMissions(missionGroups, transitionContentsId)) {
		upsertTransitionProgress(
			mission,
			master,
			Math.min(master.conditionAchieveNum, achievedNum),
			sourceMasterReleaseId,
		);
		updated = true;
	}
	return updated;
}

function matchingMissions(
	groups: readonly MissionGroupMaster[],
	transitionContentsId: number,
) {
	return groups
		.flatMap((group) => group.missionList)
		.filter((mission) => mission.transitionContentsId === transitionContentsId);
}

function upsertTransitionProgress(
	mission: UserMissionState,
	master: MissionGroupMaster['missionList'][number],
	achievedNum: number,
	sourceMasterReleaseId?: string,
): void {
	upsertMissionProgress(mission, {
		missionId: master.missionId,
		...(sourceMasterReleaseId === undefined ? {} : { sourceMasterReleaseId }),
		...(master.identityFingerprint === undefined
			? {}
			: { identityFingerprint: master.identityFingerprint }),
		achievedNum,
		isAchieved: achievedNum >= master.conditionAchieveNum,
	});
}
