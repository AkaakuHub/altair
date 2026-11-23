import type {
	ChapterMission,
	ChapterPointReward,
} from '../../state/chapter-definition.ts';
import type {
	ChapterCategoryInfoResponse,
	ChapterPointRewardsResponse,
} from './archive-chapter-login-response-types.ts';

export type ChapterCategoryRequest = { category_id: number };
export type ChapterClaimRequest = { current_point?: number };
export type ChapterCategoryResponse =
	ChapterCategoryInfoResponse<ChapterMission>;
export type ChapterRewardsResponse =
	ChapterPointRewardsResponse<ChapterPointReward>;
