import type { Database } from 'bun:sqlite';
import type { CardMasterRow } from './card-master-row.ts';

export function getCardMasterRow(
	database: Database,
	cardDatasId: number,
): CardMasterRow | undefined {
	const row = database
		.query(cardMasterSelectSql('WHERE d.id = ?'))
		.get(cardDatasId) as CardMasterRow | null;
	return row ?? undefined;
}
export function getAllCardMasterRows(database: Database): CardMasterRow[] {
	return database
		.query(cardMasterSelectSql('ORDER BY d.id'))
		.all() as CardMasterRow[];
}
export function getMaxLimitBreakTimes(
	database: Database,
	cardSeriesId: number,
): number {
	const row = database
		.query(
			'SELECT MAX(limit_break_times) AS max_limit_break_times FROM master_card_limit_break_materials WHERE card_series_id = ?',
		)
		.get(cardSeriesId) as { max_limit_break_times: number | null } | null;
	return row?.max_limit_break_times ?? 0;
}
export function maxCardSkillLevel(
	database: Database,
	cardSkillSeriesId: number,
): number {
	const row = database
		.query(
			'SELECT MAX(skill_level) AS max_skill_level FROM master_card_skills WHERE card_skill_series_id = ?',
		)
		.get(cardSkillSeriesId) as { max_skill_level: number | null } | null;
	if (!row?.max_skill_level)
		throw new Error(`card skill master not found: ${cardSkillSeriesId}`);
	return row.max_skill_level;
}
export function maxRhythmGameSkillLevel(
	database: Database,
	seriesId: number,
): number {
	const row = database
		.query(
			'SELECT MAX(skill_level) AS max_skill_level FROM master_rhythm_game_skills WHERE rhythm_game_skill_series_id = ?',
		)
		.get(seriesId) as { max_skill_level: number | null } | null;
	if (!row?.max_skill_level)
		throw new Error(`rhythm game skill master not found: ${seriesId}`);
	return row.max_skill_level;
}
function cardMasterSelectSql(whereOrOrderBy: string): string {
	return [
		'SELECT d.id, d.card_series_id, d.name, d.characters_id, d.rarity,',
		'd.evolve_times, d.card_level_limit_addition, d.experience_type,',
		'd.initial_smile, d.initial_pure,',
		'd.initial_cool, d.initial_mental, d.beat_point,',
		'd.special_appeal_series_id, d.skill_series_id, d.attribute_id,',
		'd.rhythm_game_skill_series_id, d.order_id,',
		'COALESCE(s.limited_type, 0) AS limited_type,',
		'COALESCE(s.evolution3_required_fan_lv, 0) AS evolution3_required_fan_lv,',
		'COALESCE(s.evolution4_required_fan_lv, 0) AS evolution4_required_fan_lv,',
		'r.evolution0_max_level, r.evolution1_max_level, r.evolution2_max_level,',
		'r.evolution3_max_level, r.evolution4_max_level',
		'FROM master_card_datas d',
		'JOIN master_card_rarities r ON r.id = d.rarity',
		'LEFT JOIN master_card_series s ON s.id = d.card_series_id',
		whereOrOrderBy,
	].join(' ');
}
