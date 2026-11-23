import type { JsonObject } from '../../state/json-state-utils.ts';
export type ArchiveHomeResponse = {
	favorite_channel_list: JsonObject[];
	live_archive_list: JsonObject[];
	trailer_archive_list: JsonObject[];
	recommend_archive_list: JsonObject[];
	with_station_list: JsonObject[];
	music_video_list: JsonObject[];
};
