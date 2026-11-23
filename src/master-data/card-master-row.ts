export type CardMasterRow = {
	id: number;
	card_series_id: number;
	name: string;
	characters_id: number;
	rarity: number;
	evolve_times: number;
	card_level_limit_addition: number;
	experience_type: number;
	initial_smile: number;
	initial_pure: number;
	initial_cool: number;
	initial_mental: number;
	beat_point: number;
	special_appeal_series_id: number;
	skill_series_id: number;
	attribute_id: number;
	rhythm_game_skill_series_id: number;
	order_id: number;
	limited_type: number;
	evolution0_max_level: number;
	evolution1_max_level: number;
	evolution2_max_level: number;
	evolution3_max_level: number;
	evolution4_max_level: number;
	evolution3_required_fan_lv: number;
	evolution4_required_fan_lv: number;
};

export function cardMaxStyleLevel(row: CardMasterRow): number {
	const maxLevel = [
		row.evolution0_max_level,
		row.evolution1_max_level,
		row.evolution2_max_level,
		row.evolution3_max_level,
		row.evolution4_max_level,
	][row.evolve_times];
	if (maxLevel === undefined)
		throw new Error(`card evolve_times is out of range: ${row.id}`);
	return maxLevel + row.card_level_limit_addition;
}
export function cardRequiredFanLevel(row: CardMasterRow): number {
	if (row.evolve_times >= 4) return row.evolution4_required_fan_lv;
	if (row.evolve_times >= 3) return row.evolution3_required_fan_lv;
	return 0;
}
export function localUserCardDataId(cardDatasId: number): string {
	const suffix = String(cardDatasId).padStart(12, '0');
	if (suffix.length > 12)
		throw new Error(
			`card_datas_id is too large for local d_card_datas_id: ${cardDatasId}`,
		);
	return `00000000-0000-0000-0000-${suffix}`;
}
