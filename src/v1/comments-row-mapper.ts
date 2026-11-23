import type {
	CommentRow,
	OfficialTimelineItem,
	TimelineItem,
} from './comments-types.ts';

export function toOfficialTimelineItem(
	item: TimelineItem,
): OfficialTimelineItem {
	const officialItem: TimelineItem = {
		...item,
		play_time_ms: undefined,
		play_time_second: undefined,
	};
	return officialItem;
}

export function rowToTimelineItem(row: CommentRow): TimelineItem {
	const animation = createAnimation(row);
	const item: TimelineItem = { timeline_id: row.timeline_id };
	if (row.name_color !== null) item.name_color = row.name_color;
	if (row.background_color !== null)
		item.background_color = row.background_color;
	if (row.text_color !== null) item.text_color = row.text_color;
	if (animation !== undefined) item.animation = animation;
	if (row.type !== null) item.type = row.type;
	if (row.sender_type !== null) item.sender_type = row.sender_type;
	if (row.user_player_id !== null) item.user_player_id = row.user_player_id;
	if (row.user_name !== null) item.user_name = row.user_name;
	if (row.submit_time !== null)
		item.submit_time = row.submit_time.includes('T')
			? row.submit_time
			: `${row.submit_time.replace(' ', 'T')}Z`;
	if (row.item_id !== null) item.item_id = row.item_id;
	if (row.amount !== null) item.amount = row.amount;
	if (row.gift_pt !== null) item.gift_pt = row.gift_pt;
	if (row.user_icon_parts_info !== null)
		item.user_icon_parts_info = row.user_icon_parts_info;
	const displayUserIcon = toBoolean(row.display_user_icon);
	if (displayUserIcon !== undefined) item.display_user_icon = displayUserIcon;
	if (row.asset_icon_parts_info !== null)
		item.asset_icon_parts_info = row.asset_icon_parts_info;
	if (row.image_size !== null) item.image_size = row.image_size;
	if (row.text_size !== null) item.text_size = row.text_size;
	const isTextBold = toBoolean(row.is_text_bold);
	if (isTextBold !== undefined) item.is_text_bold = isTextBold;
	if (row.play_time_ms !== null) {
		item.play_time_ms = row.play_time_ms;
		item.play_time_second = Math.floor(row.play_time_ms / 1000);
	}
	if (row.body !== null) item.body = row.body;
	return item;
}

const toBoolean = (value: number | null) =>
	value === null ? undefined : Boolean(value);

function createAnimation(
	row: CommentRow,
): TimelineItem['animation'] | undefined {
	const animation: NonNullable<TimelineItem['animation']> = {};
	const normal = toBoolean(row.animation_icon_normal_twinkle);
	const strong = toBoolean(row.animation_icon_strong_twinkle);
	const falling = toBoolean(row.animation_gift_box_falling);
	if (normal !== undefined) animation.icon_normal_twinkle = normal;
	if (strong !== undefined) animation.icon_strong_twinkle = strong;
	if (falling !== undefined) animation.gift_box_falling = falling;
	return Object.keys(animation).length === 0 ? undefined : animation;
}
