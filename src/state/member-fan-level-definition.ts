export type MemberFanLevelDefinition = {
	characterId: number;
	dSeasonFanLevel: number;
	memberFanLevel: number;
};

export type MemberFanLevelBoundary = {
	level: number;
	experience: number;
	cumulativeExperience: number;
};

export type SeasonFanLevelBoundary = MemberFanLevelBoundary & {
	seasonId: number;
};
