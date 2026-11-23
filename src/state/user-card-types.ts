import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import type { JsonObject, JsonValue } from './json-state-utils.ts';

export type UserCardParametersState = {
	smile: number;
	pure: number;
	cool: number;
	mental: number;
	beat_point: number;
};

export type UserCardSkillState = {
	skill_type: number;
	card_skill_series_id: number;
	skill_level: number;
	max_skill_level: number;
};

export type UserRhythmGameSkillState = {
	rhythm_game_skill_type: number;
	skill_level: number;
};

export type UserCardCharacterBonusState = {
	character_id: number;
	music_mastery_bonus: number;
	love_correction_value: number;
	music_mastery_bonus_list: JsonValue[];
	season_fan_level: number;
};

export type UserCardDataState = JsonObject & {
	source_master_release_id?: string;
	identity_fingerprint?: EntityIdentityFingerprint;
	d_card_datas_id: string;
	card_datas_id: number;
};

export type UserCardTemplateFields = {
	card_name: string;
	style_level: number;
	max_style_level: number;
	limit_break_times: number;
	max_limit_break_times: number;
	card_parameters: UserCardParametersState;
	skill_list: UserCardSkillState[];
	character_id: number;
	generations_id: number;
	series_type: number;
	card_sort_order: number;
	character_bonus: UserCardCharacterBonusState;
	is_evolve_possible: boolean;
	is_evolve_max: boolean;
	member_fan_level: number;
	is_limit_break: boolean;
	is_style_level_up: boolean;
	rhythm_game_skill_list: UserRhythmGameSkillState[];
};

export type UserCardTemplateState = UserCardDataState & UserCardTemplateFields;
