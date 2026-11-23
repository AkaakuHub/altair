import type { ActivityRecordVisibleState } from './activity-record-types.ts';
import type { VisibleArchiveWatchedHistory } from './archive-watched-history.ts';
import type {
	BeginnerMissionCategoryMaster,
	BeginnerMissionMaster,
} from './beginner-mission-master.ts';
import { syncBeginnerMissionProgressByCondition } from './beginner-mission-progress-state.ts';
import type { UserBeginnerMissionState } from './beginner-mission-types.ts';

export type BeginnerMissionUserContentSource = {
	activityRecord?: ActivityRecordVisibleState;
	archiveCollection?: VisibleArchiveWatchedHistory;
};

const beginnerMissionConditionTypes = {
	activityRecordAdv: 70,
	withliveArchive: 51,
	fesArchive: 52,
} as const;

export function syncBeginnerMissionProgressFromUserContent(
	mission: UserBeginnerMissionState,
	missionCategories: readonly BeginnerMissionCategoryMaster[],
	source: BeginnerMissionUserContentSource,
	sourceMasterReleaseId?: string,
): boolean {
	return syncBeginnerMissionProgressByCondition(
		mission,
		missionCategories,
		createUserContentAchievedNumResolver(source),
		sourceMasterReleaseId,
	);
}

function createUserContentAchievedNumResolver(
	source: BeginnerMissionUserContentSource,
): (mission: BeginnerMissionMaster) => number | undefined {
	const watchedActivityRecordAdvDataIds = new Set(
		source.activityRecord?.watchedActivityRecordAdvDataIds ?? [],
	);
	const watchedWithliveArchiveIds = new Set(
		source.archiveCollection?.watchedWithliveArchiveIds ?? [],
	);
	const watchedFesArchiveIds = new Set(
		source.archiveCollection?.watchedFesArchiveIds ?? [],
	);
	return (mission) => {
		switch (mission.conditionType) {
			case beginnerMissionConditionTypes.activityRecordAdv:
				return watchedActivityRecordAdvDataIds.has(mission.conditionDetail)
					? 1
					: 0;
			case beginnerMissionConditionTypes.withliveArchive:
				return watchedWithliveArchiveIds.size;
			case beginnerMissionConditionTypes.fesArchive:
				return watchedFesArchiveIds.size;
			default:
				return undefined;
		}
	};
}
