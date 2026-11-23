type FanLevelReadModel = {
	characterId: number;
	dSeasonFanLevel: number;
	dSeasonFanExperience: number;
	memberFanLevel: number;
	memberFanExperience: number;
};

export function createFanLevelList(memberFanLevels: FanLevelReadModel[]) {
	return memberFanLevels.map((level) => ({
		character_id: level.characterId,
		d_season_fan_level: level.dSeasonFanLevel,
		d_season_fan_experience: level.dSeasonFanExperience,
		member_fan_level: level.memberFanLevel,
		member_fan_experience: level.memberFanExperience,
	}));
}
