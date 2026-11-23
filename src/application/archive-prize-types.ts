export type ArchivePrizeCharacterPreview = {
	characterId: number;
	beforeLevel: number;
	beforeExperience: number;
	seasonBeforeLevel: number;
	seasonBeforeExperience: number;
};

export type ArchivePrizePreview = {
	liveId: string;
	userGiftPoint: number;
	userGiftPointWithoutArchive: number;
	starNum: number;
	memberExpPerStar: number;
	characters: ArchivePrizeCharacterPreview[];
	seasonId: number;
	seasonFanLevelPointStock: number;
	seasonFanLevelPointStockLimit: number;
};

export const MEMBER_EXP_PER_ARCHIVE_STAR = 1000;
export const WITHSTATION_PRIZE_SISCA = 100;
