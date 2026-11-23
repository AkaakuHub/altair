import type { BeginnerMissionCategoryMaster } from '../../state/beginner-mission-master.ts';
import { findBeginnerMissionProgress } from '../../state/beginner-mission-progress-state.ts';
import { isBeginnerMissionTypeReceived } from '../../state/beginner-mission-reward-state.ts';
import type {
	BeginnerMissionStatus,
	UserBeginnerMissionState,
} from '../../state/beginner-mission-types.ts';

export function projectHomeBeginnerMissionStatus(
	mission: UserBeginnerMissionState,
	categories: readonly BeginnerMissionCategoryMaster[],
): BeginnerMissionStatus {
	if (categories.length === 0) return 0;
	if (
		categories.every((category) =>
			isBeginnerMissionTypeReceived(mission, category),
		)
	) {
		return 2;
	}
	const hasUnreceivedBannerReward = categories.some(
		(category) =>
			!isBeginnerMissionTypeReceived(mission, category) &&
			category.missionList.length > 0 &&
			category.missionList.every(
				(masterMission) =>
					findBeginnerMissionProgress(
						mission,
						masterMission.missionId,
						masterMission.identityFingerprint,
					)?.status === 2,
			),
	);
	return hasUnreceivedBannerReward ? 1 : 0;
}
