import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { upsertMissionProgress } from './mission-progress-aggregate.ts';
import type { UserMissionState } from './mission-types.ts';

export function setMissionProgress(
	mission: UserMissionState,
	missionId: number,
	achievedNum: number,
	isAchieved: boolean,
	provenance?: {
		sourceMasterReleaseId: string;
		identityFingerprint: EntityIdentityFingerprint;
	},
): boolean {
	if (
		!Number.isSafeInteger(missionId) ||
		missionId <= 0 ||
		!Number.isSafeInteger(achievedNum) ||
		achievedNum < 0
	)
		return false;
	upsertMissionProgress(mission, {
		missionId,
		achievedNum,
		isAchieved,
		...(provenance ?? {}),
	});
	return true;
}
