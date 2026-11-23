import type { Database } from 'bun:sqlite';
import type { RhythmGameSkillLevelMasterSource } from '../application/card-growth/rhythm-game-skill-level-service.ts';

export function createRhythmGameSkillLevelMasterSource(
	database: Database,
): RhythmGameSkillLevelMasterSource {
	return {
		getRequirements: (cardDatasId, skillType, before, after) => {
			const card = database
				.query<
					{
						center_skill_lv_up_item_id: number;
						rhythm_game_skill_lv_up_item_id: number;
					},
					[number]
				>(
					'SELECT center_skill_lv_up_item_id, rhythm_game_skill_lv_up_item_id FROM master_card_datas WHERE id = ?',
				)
				.get(cardDatasId);
			if (!card) return undefined;
			const rows = database
				.query<
					{ skill_level: number; cost_items_id: number; cost_num: number },
					[number, number, number]
				>(
					[
						'SELECT pattern.skill_level, detail.cost_items_id, detail.cost_num',
						'FROM master_rhythm_game_skill_lv_up_items AS pattern',
						'JOIN master_rhythm_game_skill_lv_up_item_details AS detail ON detail.item_detail_series_id = pattern.item_detail_series_id',
						'WHERE pattern.item_series_id = ? AND pattern.skill_level >= ? AND pattern.skill_level < ?',
						'ORDER BY pattern.skill_level, detail.id',
					].join(' '),
				)
				.all(
					skillType === 1
						? card.center_skill_lv_up_item_id
						: card.rhythm_game_skill_lv_up_item_id,
					before,
					after,
				);
			return rows.map((row) => ({
				skillLevel: row.skill_level,
				itemId: row.cost_items_id,
				costNum: row.cost_num,
			}));
		},
	};
}
