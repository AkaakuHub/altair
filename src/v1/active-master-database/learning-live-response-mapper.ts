import type { UserCurrentQuestLiveState } from '../../state/user-current-quest-live-state.ts';
import type { UserLearningMusicMasteryState } from '../../state/user-learning-music-state.ts';

export function mapMusicLearningResult(
	current: UserCurrentQuestLiveState,
	before: UserLearningMusicMasteryState,
	after: UserLearningMusicMasteryState,
	beforeLevel: number,
	gainedMusicExp: number,
) {
	return {
		body: {
			stage_id: current.stageId,
			quest_live_type: 3,
			is_clear: true,
			is_mastery: after.isMastery,
			result_love: current.score,
			best_love: current.score,
			before_best_love: 0,
			music_id: current.musicId,
			play_report: current.playReport,
			mastary_level_before: beforeLevel,
			mastary_level_after: after.musicExpLevel,
			mastary_level_experience: gainedMusicExp,
			mastary_level_total_experience_before: before.earnedMusicExp,
			style_point: 200,
			before_earned_music_exp: before.earnedMusicExp,
			earned_music_exp: after.earnedMusicExp,
			first_clear_flag: false,
			is_limit_over_style_point: false,
			is_ex_stage_open: true,
		},
		statusCode: 200,
	};
}
