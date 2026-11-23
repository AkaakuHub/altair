import type { Database } from 'bun:sqlite';
import { currentUtcIsoDateTime } from '../../master-data/master-time.ts';
import type {
	GradeChallengeRuntimeState,
	GradeLiveRuntimeState,
	GrandPrixRuntimeState,
} from '../../server-state-schema.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	getActiveCampaignIds,
	getActiveRaidEvent,
	getDailyLiveStatus,
	getDreamLiveStatus,
	getMusicLiveStatus,
	getQuestTopGradeDetail,
	getStandardAreaSelect,
	getStandardLiveStatus,
} from './quest-top-master-query.ts';
import {
	projectGradeChallengeStatus,
	projectGradeLiveStatus,
	projectGrandPrixQuestTopFields,
} from './quest-top-progress-projection.ts';
import { mapQuestTopResponse } from './quest-top-response-mapper.ts';
import type { QuestTopResponse } from './quest-top-types.ts';

export function createQuestTopResponse(
	database: Database,
	grandPrix: GrandPrixRuntimeState,
	gradeChallenge: GradeChallengeRuntimeState,
	gradeLive: GradeLiveRuntimeState,
	userLive: UserLiveState,
): QuestTopResponse {
	const now = currentUtcIsoDateTime();
	return mapQuestTopResponse({
		standardLiveStatus: getStandardLiveStatus(database, now),
		dailyLiveStatus: getDailyLiveStatus(database, now),
		musicLiveStatus: getMusicLiveStatus(database, now),
		gradeLiveStatus: projectGradeLiveStatus(database, userLive, gradeLive, now),
		gradeChallengeStatus: projectGradeChallengeStatus(gradeChallenge, now),
		gradeChallenge,
		gradeDetail: getQuestTopGradeDetail(database),
		dreamLiveStatus: getDreamLiveStatus(database, now),
		grandPrixFields: projectGrandPrixQuestTopFields(grandPrix),
		raidEvent: getActiveRaidEvent(database, now),
		openCampaignIds: getActiveCampaignIds(database, now),
		standardAreaSelect: getStandardAreaSelect(database, now),
	});
}
