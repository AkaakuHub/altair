import type { Database } from 'bun:sqlite';
import { currentUtcIsoDateTime } from '../../master-data/master-time.ts';
import type { QuestMusicInfoResponse } from '../response-types/quest-common-response-types.ts';

export function musicListForQuestFromDatabase(
	database: Database,
	questMusicsType: number,
	musicId: number,
): QuestMusicInfoResponse[] {
	if (questMusicsType === 2 && musicId > 0) {
		return createEnabledMusicList([musicId]);
	}
	if (questMusicsType === 3 && musicId > 0) {
		return musicListByColumnFromDatabase(
			database,
			'center_character_id',
			musicId,
		);
	}
	if (questMusicsType === 0 && musicId > 0) {
		return musicListByColumnFromDatabase(database, 'generations_id', musicId);
	}
	if (questMusicsType === 0 && musicId === 0) {
		return createEnabledMusicList(queryMusicIds(database));
	}
	return [];
}

export function musicListByColumnFromDatabase(
	database: Database,
	columnName: 'generations_id' | 'center_character_id',
	value: number,
): QuestMusicInfoResponse[] {
	const rows = database
		.query<{ id: number }, [number]>(
			`SELECT id FROM master_musics WHERE ${columnName} = ? ORDER BY id`,
		)
		.all(value);
	return createEnabledMusicList(rows.map((row) => row.id));
}

export function musicListWithScoreFromDatabase(
	database: Database,
): QuestMusicInfoResponse[] {
	const rows = database
		.query<{ id: number }, [string]>(
			[
				'SELECT id',
				'FROM master_musics',
				'WHERE datetime(music_score_release_time) <= datetime(?)',
				'ORDER BY id',
			].join(' '),
		)
		.all(currentUtcIsoDateTime());
	return createEnabledMusicList(rows.map((row) => row.id));
}

export function createEnabledMusicList(
	musicIds: readonly number[],
): QuestMusicInfoResponse[] {
	return musicIds.map((musicId) => ({
		m_musics_id: musicId,
		is_enable: true,
	}));
}

function queryMusicIds(database: Database): number[] {
	const rows = database
		.query<{ id: number }, []>('SELECT id FROM master_musics ORDER BY id')
		.all();
	return rows.map((row) => row.id);
}
