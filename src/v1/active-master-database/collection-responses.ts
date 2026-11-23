import type { Database } from 'bun:sqlite';
import { currentUtcIsoDateTime } from '../../master-data/master-time.ts';
import type {
	CollectionMusicInfoResponse,
	CollectionMusicListResponse,
	GallaryListResponse,
} from '../response-types/collection-response-types.ts';

type MusicRow = {
	id: number;
};

type ComicRow = {
	id: number;
	name: string;
};

export function createCollectionMusicListResponse(
	database: Database,
): CollectionMusicListResponse {
	return {
		music_info_list: collectionMusicInfoList(database),
	};
}

export function createGallaryListResponse(
	database: Database,
): GallaryListResponse {
	const now = currentUtcIsoDateTime();
	return {
		gallary_info_list: activeComicRows(database, now).map((comic) => ({
			comics_id: comic.id,
			name: comic.name,
		})),
	};
}

export function collectionMusicInfoList(
	database: Database,
): CollectionMusicInfoResponse[] {
	const now = currentUtcIsoDateTime();
	return activeMusicRows(database, now).map((music) => ({
		musics_id: music.id,
		is_mastery: true,
		play_count: 0,
		latest_play_time: '0001-01-01T00:00:00Z',
	}));
}

function activeMusicRows(database: Database, now: string): MusicRow[] {
	return database
		.query<MusicRow, [string, string]>(
			[
				'SELECT id',
				'FROM master_musics',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id',
			].join(' '),
		)
		.all(now, now);
}

function activeComicRows(database: Database, now: string): ComicRow[] {
	return database
		.query<ComicRow, [string, string]>(
			[
				'SELECT id, name',
				'FROM master_comics',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id',
			].join(' '),
		)
		.all(now, now);
}
