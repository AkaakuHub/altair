import type { GradeChallengeRuntimeState } from '../../server-state-schema.ts';
import type { TimedMasterRow } from './quest-top-master-query.ts';
import type {
	QuestTopGradeDetail,
	QuestTopResponse,
	QuestTopStatus,
} from './quest-top-types.ts';

type QuestTopMappingInput = {
	standardLiveStatus: QuestTopStatus;
	dailyLiveStatus: QuestTopStatus;
	musicLiveStatus: QuestTopStatus;
	gradeLiveStatus: QuestTopStatus;
	gradeChallengeStatus: QuestTopStatus;
	gradeChallenge: GradeChallengeRuntimeState;
	gradeDetail: QuestTopGradeDetail;
	dreamLiveStatus: QuestTopStatus;
	grandPrixFields: Pick<
		QuestTopResponse,
		| 'grand_prix_open'
		| 'grand_prix_status'
		| 'grand_prix_id'
		| 'grand_prix_start_datetime'
		| 'grand_prix_end_datetime'
	>;
	raidEvent: TimedMasterRow | null;
	openCampaignIds: number[];
	standardAreaSelect: QuestTopResponse['standard_area_select'];
};

export function mapQuestTopResponse(
	input: QuestTopMappingInput,
): QuestTopResponse {
	const challengeActive = input.gradeChallengeStatus === 1;
	return {
		standard_live_status: input.standardLiveStatus,
		daily_live_status: input.dailyLiveStatus,
		music_live_status: input.musicLiveStatus,
		grade_live_status: input.gradeLiveStatus,
		grade_challenge_status: input.gradeChallengeStatus,
		grade_challenge_season_id: challengeActive
			? input.gradeChallenge.activeGradeChallengeSeasonId
			: 0,
		grade_challenge_season_start_datetime: challengeActive
			? input.gradeChallenge.startDate
			: null,
		grade_challenge_season_end_datetime: challengeActive
			? input.gradeChallenge.endDate
			: null,
		grade_detail: input.gradeDetail,
		dream_live_status: input.dreamLiveStatus,
		...input.grandPrixFields,
		raid_event_status: input.raidEvent === null ? 0 : 1,
		raid_event_id: input.raidEvent?.id ?? 0,
		raid_event_start_datetime: input.raidEvent?.start_time ?? null,
		raid_event_end_datetime: input.raidEvent?.end_time ?? null,
		open_campaign_id_list: input.openCampaignIds,
		standard_area_select: input.standardAreaSelect,
	};
}
