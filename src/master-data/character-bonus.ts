import type { UserCardCharacterBonusState } from '../state/user-card-types.ts';

export function defaultCharacterBonus(): UserCardCharacterBonusState {
	return {
		character_id: 0,
		music_mastery_bonus: 0,
		love_correction_value: 0,
		music_mastery_bonus_list: [],
		season_fan_level: 0,
	};
}
