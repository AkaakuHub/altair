import type { Database } from 'bun:sqlite';
import {
	getArchiveFilterableCharactersFromDatabase,
	getArchiveSortableFieldsFromDatabase,
	getWithStationListItemsFromDatabase,
} from '../../master-data/archive-master-data.ts';

export function getArchiveHomeFromDatabase(database: Database) {
	return {
		body: {
			favorite_channel_list: [] satisfies [],
			live_archive_list: [] satisfies [],
			trailer_archive_list: [] satisfies [],
			recommend_archive_list: [] satisfies [],
			with_station_list: getWithStationListItemsFromDatabase(database),
			music_video_list: [] satisfies [],
		},
		statusCode: 200,
	};
}

export function getWithStationListFromDatabase(database: Database) {
	return {
		body: {
			with_station_list: getWithStationListItemsFromDatabase(database),
			filterable_characters:
				getArchiveFilterableCharactersFromDatabase(database),
			sortable_fields: getArchiveSortableFieldsFromDatabase(database),
		},
		statusCode: 200,
	};
}
