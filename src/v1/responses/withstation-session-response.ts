import type { createArchivePrizePreview } from '../../application/archive-prize-preview.ts';
import { WITHSTATION_PRIZE_SISCA } from '../../application/archive-prize-types.ts';
import type { CommentsRepository } from '../comments-read-repository.ts';

const WITHSTATION_SEASON_EXP_PER_STAR = 1000;
const WITHSTATION_MAX_SEASON_FAN_LEVEL = 10;
export function createWithstationPrizeResponse(
	preview: NonNullable<ReturnType<typeof createArchivePrizePreview>>,
	hasPlaybackReward: boolean,
) {
	return {
		items: hasPlaybackReward
			? [
					{
						item_id: 1002001,
						item_type: 3,
						item_num: WITHSTATION_PRIZE_SISCA,
					},
				]
			: [],
		user_gift_pt: preview.userGiftPoint,
		star_info: {
			star_num: preview.starNum,
			member_exp_per_star: preview.memberExpPerStar,
			season_exp_per_star: WITHSTATION_SEASON_EXP_PER_STAR,
		},
		characters: preview.characters.map((character) => ({
			character_id: character.characterId,
			season_fan_level_info: {
				in_season: true,
				max_level: WITHSTATION_MAX_SEASON_FAN_LEVEL,
				before_level: character.seasonBeforeLevel,
				before_exp: character.seasonBeforeExperience,
			},
			member_fan_level_info: {
				before_level: character.beforeLevel,
				before_exp: character.beforeExperience,
			},
		})),
		season_id: preview.seasonId,
		season_fanlevel_point_stock: preview.seasonFanLevelPointStock,
		season_fanlevel_point_stock_limit: preview.seasonFanLevelPointStockLimit,
	};
}
export function createWithstationInfoResponse(
	timelines: ReturnType<CommentsRepository['findBetweenMilliseconds']>,
) {
	return {
		timelines: timelines,
		polling_interval_ms: 1000,
		has_extra_admission: false,
		is_archive_published: true,
	};
}
