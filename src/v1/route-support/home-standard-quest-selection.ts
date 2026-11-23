import type { Database } from 'bun:sqlite';
import { getQuestStageIdentityFingerprint } from '../../master-data/quest-stage-identity.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { isQuestStageProgressCompatible } from '../../state/user-quest-progress-compatibility.ts';
import { findStandardQuestStageAreaId } from '../active-master-database/standard-quest-master-query.ts';

export type HomeStandardQuestSelection = Readonly<{
	standardQuestAreaId: number;
	standardQuestStageId: number;
}>;

type HomeStandardQuestMaster = Readonly<{
	findAreaId: (stageId: number) => number | undefined;
	isCurrentStage: (
		progress: UserLiveState['questStageProgressList'][number],
	) => boolean;
}>;

export function projectHomeStandardQuestSelection(
	userLive: UserLiveState,
	master: HomeStandardQuestMaster,
): HomeStandardQuestSelection {
	let progress: UserLiveState['questStageProgressList'][number] | undefined;
	for (
		let index = userLive.questStageProgressList.length - 1;
		index >= 0;
		index--
	) {
		const candidate = userLive.questStageProgressList[index];
		if (
			candidate !== undefined &&
			candidate.questLiveType === 1 &&
			candidate.playCount > 0 &&
			master.isCurrentStage(candidate)
		) {
			progress = candidate;
			break;
		}
	}
	if (progress === undefined) {
		return { standardQuestAreaId: 0, standardQuestStageId: 0 };
	}
	const areaId = master.findAreaId(progress.stageId);
	if (areaId === undefined) {
		throw new Error(
			`Standard quest area is missing for current stage: ${progress.stageId}`,
		);
	}
	return {
		standardQuestAreaId: areaId,
		standardQuestStageId: progress.stageId,
	};
}

export function projectHomeStandardQuestSelectionFromDatabase(
	database: Database,
	userLive: UserLiveState,
): HomeStandardQuestSelection {
	return projectHomeStandardQuestSelection(userLive, {
		findAreaId: (stageId) => findStandardQuestStageAreaId(database, stageId),
		isCurrentStage: (progress) => {
			const fingerprint = getQuestStageIdentityFingerprint(
				database,
				1,
				progress.stageId,
			);
			return (
				fingerprint !== undefined &&
				isQuestStageProgressCompatible(progress, fingerprint)
			);
		},
	});
}
