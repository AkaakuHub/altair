import type { Database } from 'bun:sqlite';
export type RhythmGameGrandPrixSeriesRow = {
	id: number;
	grand_prixes_id: number;
	order_id: number;
	quest_musics_type: number;
	quest_musics_detail: number;
};
export function getGrandPrixQuestSeriesRows(
	database: Database,
	grandPrixId: number,
) {
	return database
		.query<{ id: number }, [number]>(
			'SELECT id FROM master_grand_prix_quest_series WHERE grand_prixes_id = ? ORDER BY order_id',
		)
		.all(grandPrixId);
}
export function getGrandPrixQuestStageRows(
	database: Database,
	seriesId: number,
) {
	return database
		.query<{ id: number }, [number]>(
			'SELECT id FROM master_grand_prix_quest_stages WHERE grand_prix_series_id = ? ORDER BY order_id',
		)
		.all(seriesId);
}
export function getRhythmGameGrandPrixSeriesRows(
	database: Database,
	grandPrixId: number,
) {
	return database
		.query<RhythmGameGrandPrixSeriesRow, [number]>(
			'SELECT id, grand_prixes_id, order_id, quest_musics_type, quest_musics_detail FROM master_grand_prix_rhythm_game_series WHERE grand_prixes_id = ? ORDER BY order_id',
		)
		.all(grandPrixId);
}
export function getGrandPrixRewardDataRows(
	database: Database,
	rewardId: number,
) {
	return database
		.query<
			{
				id: number;
				reward_type: number;
				reward_item_id: number;
				reward_num: number;
			},
			[number]
		>(
			'SELECT id, reward_type, reward_item_id, reward_num FROM master_grand_prix_reward_datas WHERE grand_prix_rewards_id = ? ORDER BY id',
		)
		.all(rewardId);
}
