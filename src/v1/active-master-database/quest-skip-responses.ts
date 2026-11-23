import type { Database } from 'bun:sqlite';
import { requireMusicProvenance } from '../../master-data/music-identity.ts';
import { musicLevelForEarnedExperienceFromDatabase } from '../../master-data/music-levels.ts';
import { getQuestStageIdentityFingerprint } from '../../master-data/quest-stage-identity.ts';
import { saveUserLearningMusicMastery } from '../../state/user-learning-music-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { recordUserQuestStageResult } from '../../state/user-standard-quest-progress.ts';
import { stamina } from './basic-data.ts';
import { getUserLearningMusicMastery } from './learning-live-progress-mutation.ts';
import { lookupLearningGainMusicExpFromDatabase } from './learning-stage-data.ts';
import {
	findQuestStageMusicFromDatabase,
	lookupGainStylePointFromDatabase,
} from './quest-stage-data.ts';

export function skipQuest(
	database: Database,
	sourceMasterReleaseId: string,
	userLive: UserLiveState,
	questLiveType: number,
	stageId: number,
	skipCount: number,
) {
	const identityFingerprint = getQuestStageIdentityFingerprint(
		database,
		questLiveType,
		stageId,
	);
	const stageMusic = findQuestStageMusicFromDatabase(database, stageId);
	const gainedStylePoint =
		lookupGainStylePointFromDatabase(database, stageId) * skipCount;
	const mastery =
		questLiveType === 3 && stageMusic.musicId > 0
			? getUserLearningMusicMastery(
					database,
					sourceMasterReleaseId,
					userLive,
					stageMusic.musicId,
				)
			: undefined;
	const masteryLevelBefore =
		mastery === undefined
			? 1
			: mastery.isMastery
				? musicLevelForEarnedExperienceFromDatabase(
						database,
						mastery.earnedMusicExp,
					)
				: mastery.musicExpLevel;
	const masteryExperience =
		questLiveType === 3
			? lookupLearningGainMusicExpFromDatabase(database, stageId) * skipCount
			: 0;
	const masteryTotalExperienceBefore = mastery?.earnedMusicExp ?? 0;
	const masteryLevelAfter =
		mastery === undefined
			? 1
			: musicLevelForEarnedExperienceFromDatabase(
					database,
					masteryTotalExperienceBefore + masteryExperience,
				);
	if (mastery !== undefined) {
		saveUserLearningMusicMastery(
			userLive,
			{
				...mastery,
				musicExpLevel: masteryLevelAfter,
				earnedMusicExp: masteryTotalExperienceBefore + masteryExperience,
			},
			requireMusicProvenance(
				database,
				sourceMasterReleaseId,
				stageMusic.musicId,
			),
		);
	}
	for (let count = 0; count < skipCount; count += 1) {
		recordUserQuestStageResult(
			userLive,
			questLiveType,
			stageId,
			stageMusic.musicId,
			0,
			identityFingerprint === undefined
				? undefined
				: { sourceMasterReleaseId, identityFingerprint },
		);
	}
	return {
		body: {
			quest_live_type: questLiveType,
			quest_live_id: '',
			user_stamina: stamina(),
			add_style_point: gainedStylePoint,
			skip_reward_list: createSkipRewardList(questLiveType, skipCount),
			total_skip_reward_list: [] satisfies [],
			is_limit_over_style_point: false,
			mastery_level_before: masteryLevelBefore,
			mastery_level_after: masteryLevelAfter,
			mastery_level_experience: masteryExperience,
			mastery_level_total_experience_before: masteryTotalExperienceBefore,
			before_earned_music_exp: 0,
			earned_music_exp: 0,
			raid_stamina: {
				stamina_now: 0,
				stamina_recovered_time: '0001-01-01T00:00:00Z',
			},
			add_once_event_point: 0,
			event_point_reward_list: [] satisfies [],
			event_personal_total_point: 0,
			applied_campaign_types: [] satisfies [],
		},
		statusCode: 200,
	};
}

function createSkipRewardList(questLiveType: number, skipCount: number) {
	if (questLiveType === 1) {
		return [];
	}
	return Array.from({ length: skipCount }, () => ({ reward_list: null }));
}
