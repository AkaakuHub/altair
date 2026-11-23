import type { JsonValue } from '../../../state/json-state-utils.ts';
export type SavedArchiveDetail = {
	archive_url?: string;
	chapters: Array<{
		is_available?: boolean;
		is_extra: boolean;
		name: string;
		play_time_second?: number;
	}>;
	characters: Array<{
		character_id: number;
		is_guest: boolean;
	}>;
	content_code: number;
	costume_ids: Array<number>;
	current_camera_type?: number;
	current_play_time_second: number;
	description: string;
	enquetes?: Array<{
		enquete_id: string;
		options: Array<{
			is_correct: null | boolean;
			is_max_rate: boolean;
			option_id: string;
			option_letter: string;
			rate: number;
			text: string;
		}>;
		question: string;
		selected_option_id: string | null;
		status: number;
	}>;
	gift_pt_rankings: Array<JsonValue>;
	gift_star_reward_segments?: Array<number>;
	gift_stars_threshold_for_extra_admission?: number;
	has_extra?: boolean;
	has_extra_admission: boolean;
	is_archive_published?: boolean;
	is_horizontal?: boolean;
	live_location_id: number;
	live_start_time: string;
	selectable_camera_types?: Array<number>;
	ticket_rank?: number;
	timeline_ids: Array<number>;
	timelines: Array<JsonValue>;
	title: string;
	total_gift_pt: string;
	total_play_time_second?: number;
	total_play_time_second_including_extra?: number;
	total_play_time_second_without_extra?: number;
	unixtime_live_rec_started: number;
	user_gift_pt?: number;
	user_gift_pt_including_archive?: number;
	user_gift_pt_ranking: number;
	user_gift_pt_without_archive?: number;
	user_icon_parts_info: string;
	video_url?: string;
	viewer_count: number;
};
