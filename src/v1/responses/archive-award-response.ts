import type { createArchivePrizePreview } from '../../application/archive-prize-preview.ts';
export function createArchivePrizeResponse(
	preview: NonNullable<ReturnType<typeof createArchivePrizePreview>>,
) {
	return {
		characters: preview.characters.map((character) => ({
			character_id: character.characterId,
			member_fan_level_info: {
				before_exp: character.beforeExperience,
				before_level: character.beforeLevel,
			},
		})),
		season_fanlevel_point_stock: preview.seasonFanLevelPointStock,
		season_fanlevel_point_stock_limit: preview.seasonFanLevelPointStockLimit,
		season_id: preview.seasonId,
		star_info: {
			member_exp_per_star: preview.memberExpPerStar,
			star_num: preview.starNum,
		},
		user_gift_pt: preview.userGiftPoint,
		user_gift_pt_without_archive: preview.userGiftPointWithoutArchive,
	};
}
export function createArchiveGiftResponse(
	userGiftPoint: number,
	totalUserGiftPoint: number,
) {
	return {
		total_user_gift_pt: totalUserGiftPoint,
		user_gift_pt: userGiftPoint,
	};
}
