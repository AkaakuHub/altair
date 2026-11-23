export type UserStatusView = {
	fanLevel: number;
	jewelFree: number;
	jewelPaidApple: number;
	jewelPaidGoogle: number;
	jewelStaminaRecoveryCount: number;
	jewelStaminaRecoveryGameDate: string | null;
	presentBoxCount: number;
	staminaNow: number;
	staminaMax: number;
	staminaRecoveryTime: string;
	seasonFanLevelSeasonId: number;
	seasonFanLevelPointStock: number;
	seasonFanLevelPointStockLimit: number;
	memberFanLevels: MemberFanLevelState[];
	fanLevelEarnProgresses: FanLevelEarnProgressState[];
	seasonFanLevels: SeasonFanLevelState[];
};

export type MemberFanLevelState = {
	characterId: number;
	dSeasonFanLevel: number;
	dSeasonFanExperience: number;
	memberFanLevel: number;
	memberFanExperience: number;
};

export type FanLevelEarnProgressState = {
	characterId: number;
	earnType: number;
	totalPoint: number;
	seasonPointHistoryList: FanLevelSeasonPointHistoryState[];
};

export type SeasonFanLevelState = {
	seasonId: number;
	pointStock: number;
	pointStockLimit: number;
	memberFanLevels: SeasonMemberFanLevelState[];
};

export type SeasonMemberFanLevelState = {
	characterId: number;
	dSeasonFanLevel: number;
	dSeasonFanExperience: number;
};

export type FanLevelSeasonPointHistoryState = {
	seasonId: number;
	pointHistoryList: FanLevelPointHistoryState[];
};

export type FanLevelPointHistoryState = {
	date: string;
	message: string;
	point: number;
};

export type UserStatusState = {
	playerId: string;
	jewelFree: number;
	jewelPaidApple: number;
	jewelPaidGoogle: number;
	jewelStaminaRecoveryCount: number;
	jewelStaminaRecoveryGameDate: string | null;
	staminaNow: number;
	staminaMax: number;
	staminaRecoveryTime: string;
	seasonFanLevelSeasonId: number;
	seasonFanLevelPointStock: number;
	seasonFanLevelPointStockLimit: number;
	memberFanLevels: MemberFanLevelState[];
	seasonFanLevels: SeasonFanLevelState[];
	fanLevelEarnProgresses: FanLevelEarnProgressState[];
};

export type UserStatusUpdateValues = Omit<
	UserStatusState,
	'playerId' | 'seasonFanLevels'
>;
