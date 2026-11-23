import { createMissionProgressController } from './application/mission-progress-controller-composition.ts';
import type { MissionProgressController } from './application/mission-progress-controller-types.ts';
import { getBeginnerMissionCategoriesFromDatabase } from './master-data/beginner-mission-master-data.ts';
import { getMissionGroupsFromDatabase } from './master-data/mission-group-master-repository.ts';
import { getQuestStageIdentityFingerprint } from './master-data/quest-stage-identity.ts';
import type { ServerState } from './server-state-schema.ts';
import { isQuestStageProgressCompatible } from './state/user-quest-progress-compatibility.ts';

export function createMasterBackedMissionProgressController(
	state: ServerState,
	database: Database,
	sourceMasterReleaseId?: string,
): MissionProgressController {
	return createMissionProgressController(state, {
		...(sourceMasterReleaseId === undefined ? {} : { sourceMasterReleaseId }),
		getBeginnerMissionCategories: () =>
			getBeginnerMissionCategoriesFromDatabase(database),
		getMissionGroups: () => getMissionGroupsFromDatabase(database),
		isStandardQuestProgressCompatible: (progress) => {
			const target = getQuestStageIdentityFingerprint(
				database,
				1,
				progress.stageId,
			);
			return (
				target !== undefined && isQuestStageProgressCompatible(progress, target)
			);
		},
	});
}

import type { Database } from 'bun:sqlite';
