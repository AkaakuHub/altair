import type { UserQuestStageProgressState } from '../../state/user-quest-progress-types.ts';
import type {
	QuestClearStatus,
	StandardQuestStageDetailResponse,
} from '../response-types/standard-quest-response-types.ts';
import { questClearStatus } from './quest-stage-progression.ts';

export function parseStandardQuestStageIdList(value: string): number[] {
	return value
		.split(',')
		.map((id) => Number(id))
		.filter((id) => Number.isInteger(id) && id > 0);
}

export function standardQuestStageDetail(
	stageId: number,
	progress: UserQuestStageProgressState,
): StandardQuestStageDetailResponse {
	return {
		stage_id: stageId,
		is_challenge: false,
		is_skip: progress.playCount > 0,
		clear_status: questClearStatus(progress),
		best_love_music_id: progress.bestLoveMusicId ?? 0,
		stage_reward_list: [],
		stage_challenge_reward_list: null,
		best_love: progress.highScore,
	};
}

export function compareQuestClearStatus(
	left: QuestClearStatus,
	right: QuestClearStatus,
): number {
	if (left.is_lock !== right.is_lock) {
		return left.is_lock ? 1 : -1;
	}
	return right.stages_id - left.stages_id;
}
