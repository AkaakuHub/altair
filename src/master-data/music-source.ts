import type { Database } from 'bun:sqlite';
export function findMusicSource(database: Database, musicId: number) {
	return database
		.query<{ id: number; sound_id: number }, [number]>(
			'SELECT id, sound_id FROM master_musics WHERE id = ?',
		)
		.get(musicId);
}
