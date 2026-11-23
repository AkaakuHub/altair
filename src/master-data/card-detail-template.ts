import type { Database } from 'bun:sqlite';
import type {
	UserCardCharacterBonusState,
	UserCardSkillState,
	UserCardTemplateState,
	UserRhythmGameSkillState,
} from '../state/user-card-types.ts';
import {
	getCardMasterRow,
	getMaxLimitBreakTimes,
	maxCardSkillLevel,
	maxRhythmGameSkillLevel,
} from './card-master-query.ts';
import {
	type CardMasterRow,
	cardMaxStyleLevel,
	localUserCardDataId,
} from './card-master-row.ts';
import { defaultCharacterBonus } from './character-bonus.ts';

export function getCardDetailTemplateByCardDatasIdFromDatabase(
	database: Database,
	cardDatasId: number,
): UserCardTemplateState | undefined {
	const row = getCardMasterRow(database, cardDatasId);
	return row ? createCardTemplate(database, row) : undefined;
}
export function getCardCharacterBonusFromDatabase(
	database: Database,
	cardDatasId: number,
): UserCardCharacterBonusState {
	const row = getCardMasterRow(database, cardDatasId);
	if (!row) throw new Error(`card master not found: ${cardDatasId}`);
	return createCharacterBonus(row.characters_id);
}
export function createCardTemplate(
	database: Database,
	row: CardMasterRow,
): UserCardTemplateState {
	return {
		d_card_datas_id: localUserCardDataId(row.id),
		card_datas_id: row.id,
		card_series_id: row.card_series_id,
		card_name: row.name,
		experience_type: row.experience_type,
		style_level: 1,
		max_style_level: cardMaxStyleLevel(row),
		limit_break_times: 0,
		max_limit_break_times: getMaxLimitBreakTimes(database, row.card_series_id),
		card_parameters: {
			smile: row.initial_smile,
			pure: row.initial_pure,
			cool: row.initial_cool,
			mental: row.initial_mental,
			beat_point: row.beat_point,
		},
		skill_list: createSkillList(database, row),
		character_id: row.characters_id,
		generations_id: Math.trunc(row.characters_id / 10),
		series_type: 0,
		card_sort_order: row.order_id,
		character_bonus: createCharacterBonus(row.characters_id),
		is_evolve_possible: false,
		is_evolve_max: false,
		member_fan_level: 0,
		is_limit_break: false,
		is_style_level_up: false,
		rhythm_game_skill_list: createRhythmGameSkillList(database, row),
	};
}
function createSkillList(
	database: Database,
	row: CardMasterRow,
): UserCardSkillState[] {
	const skills: UserCardSkillState[] = [];
	if (row.special_appeal_series_id > 0)
		skills.push({
			skill_type: 1,
			card_skill_series_id: row.special_appeal_series_id,
			skill_level: 1,
			max_skill_level: maxCardSkillLevel(
				database,
				row.special_appeal_series_id,
			),
		});
	if (row.skill_series_id > 0)
		skills.push({
			skill_type: 2,
			card_skill_series_id: row.skill_series_id,
			skill_level: 1,
			max_skill_level: maxCardSkillLevel(database, row.skill_series_id),
		});
	if (row.attribute_id > 0)
		skills.push({
			skill_type: 3,
			card_skill_series_id: row.attribute_id,
			skill_level: 1,
			max_skill_level: 1,
		});
	return skills;
}
function createRhythmGameSkillList(
	database: Database,
	row: CardMasterRow,
): UserRhythmGameSkillState[] {
	if (row.rhythm_game_skill_series_id <= 0) return [];
	maxRhythmGameSkillLevel(database, row.rhythm_game_skill_series_id);
	return [
		{ rhythm_game_skill_type: 1, skill_level: 1 },
		{ rhythm_game_skill_type: 2, skill_level: 1 },
	];
}
function createCharacterBonus(
	characterId: number,
): UserCardCharacterBonusState {
	return { ...defaultCharacterBonus(), character_id: characterId };
}
