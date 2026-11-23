import type { Database } from 'bun:sqlite';

export function getGrandPrixQuestStageIds(
	database: Database,
	questId: number,
): number[] {
	return database
		.query<{ id: number }, [number]>(
			[
				'SELECT s.id FROM master_grand_prix_quest_stages s',
				'WHERE s.grand_prix_series_id = ? ORDER BY s.order_id',
			].join(' '),
		)
		.all(questId)
		.map((row) => row.id);
}

export function findGrandPrixIdByQuestIdFromDatabase(
	database: Database,
	questId: number,
): number | undefined {
	return database
		.query<{ grand_prixes_id: number }, [number]>(
			'SELECT grand_prixes_id FROM master_grand_prix_quest_series WHERE id = ?',
		)
		.get(questId)?.grand_prixes_id;
}

export function findGrandPrixIdByStageIdFromDatabase(
	database: Database,
	stageId: number,
): number | undefined {
	return database
		.query<{ grand_prixes_id: number }, [number]>(
			[
				'SELECT s.grand_prixes_id FROM master_grand_prix_quest_series s',
				'JOIN master_grand_prix_quest_stages st ON st.grand_prix_series_id = s.id',
				'WHERE st.id = ?',
			].join(' '),
		)
		.get(stageId)?.grand_prixes_id;
}

export function findGrandPrixStageMusicId(
	database: Database,
	stageId: number,
): number {
	return (
		database
			.query<{ quest_musics_detail: number }, [number]>(
				'SELECT quest_musics_detail FROM master_grand_prix_quest_stages WHERE id = ?',
			)
			.get(stageId)?.quest_musics_detail ?? 0
	);
}

export function findGrandPrixStageRank(
	database: Database,
	stageId: number,
): number {
	return (
		database
			.query<{ quest_rank: number }, [number]>(
				'SELECT quest_rank FROM master_grand_prix_quest_stages WHERE id = ?',
			)
			.get(stageId)?.quest_rank ?? 0
	);
}
