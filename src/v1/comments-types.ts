export type CommentRow = {
	timeline_id: string;
	live_id: string;
	type: string | number | null;
	user_name: string | null;
	submit_time: string | null;
	item_id: number | null;
	amount: number | null;
	gift_pt: number | null;
	user_icon_parts_info: string | null;
	display_user_icon: number | null;
	image_size: number | null;
	name_color: string | null;
	background_color: string | null;
	text_color: string | null;
	sender_type: string | null;
	user_player_id: string | null;
	play_time_ms: number | null;
	body: string | null;
	animation_icon_normal_twinkle: number | null;
	animation_icon_strong_twinkle: number | null;
	animation_gift_box_falling: number | null;
	asset_icon_parts_info: string | null;
	text_size: number | null;
	is_text_bold: number | null;
};

export type TimelineItem = {
	timeline_id: string;
	name_color?: string;
	background_color?: string;
	text_color?: string;
	animation?: {
		icon_normal_twinkle?: boolean;
		icon_strong_twinkle?: boolean;
		gift_box_falling?: boolean;
	};
	type?: string | number;
	sender_type?: string;
	user_player_id?: string;
	user_name?: string;
	submit_time?: string;
	item_id?: number;
	amount?: number;
	gift_pt?: number;
	user_icon_parts_info?: string;
	display_user_icon?: boolean;
	asset_icon_parts_info?: string;
	image_size?: number;
	text_size?: number;
	is_text_bold?: boolean;
	play_time_ms?: number | undefined;
	play_time_second?: number | undefined;
	body?: string;
};

export type OfficialTimelineItem = Omit<
	TimelineItem,
	'play_time_ms' | 'play_time_second'
>;
