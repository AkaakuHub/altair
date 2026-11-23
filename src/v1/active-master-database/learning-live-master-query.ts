import type { Database } from 'bun:sqlite';
export type MusicLearningSeriesRow = {
	series_id: number;
	music_id: number;
	ex_release_conditions_level: number;
};
const select = [
	'SELECT id AS series_id, musics_id AS music_id,',
	'ex_release_conditions_level',
	'FROM master_music_learning_quest_series',
];
export function getMusicLearningSeriesRows(
	database: Database,
): MusicLearningSeriesRow[] {
	return database
		.query([...select, 'ORDER BY id'].join(' '))
		.all() as MusicLearningSeriesRow[];
}
export function getMusicLearningSeriesRowByMusicId(
	database: Database,
	musicId: number,
): MusicLearningSeriesRow | undefined {
	return database
		.query([...select, 'WHERE musics_id = ?'].join(' '))
		.get(musicId) as MusicLearningSeriesRow | undefined;
}
