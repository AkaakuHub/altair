import { Database, type Statement } from 'bun:sqlite';
import {
	createCommentAfterCursor,
	createCommentRange,
	createCommentSecondWindow,
} from './comments-query-window.ts';
import {
	rowToTimelineItem,
	toOfficialTimelineItem,
} from './comments-row-mapper.ts';
import type {
	CommentRow,
	OfficialTimelineItem,
	TimelineItem,
} from './comments-types.ts';

const columns = `timeline_id, live_id, type, user_name, submit_time, item_id, amount,
gift_pt, user_icon_parts_info, display_user_icon, image_size, name_color,
background_color, text_color, sender_type, user_player_id, play_time_ms, body,
animation_icon_normal_twinkle, animation_icon_strong_twinkle,
animation_gift_box_falling, asset_icon_parts_info, text_size, is_text_bold`;

export class CommentsRepository {
	private readonly bySecond: Statement<CommentRow, [string, number, number]>;
	private readonly after: Statement<CommentRow, [string, number, number]>;
	private readonly range: Statement<
		CommentRow,
		[string, number, number, number]
	>;

	constructor(dbPath: string) {
		const database = new Database(dbPath, { readonly: true, strict: true });
		this.bySecond = database.query(
			`SELECT ${columns} FROM withlive_comments WHERE live_id = ? AND play_time_ms >= ? AND play_time_ms < ? ORDER BY play_time_ms, timeline_id`,
		);
		this.after = database.query(
			`SELECT ${columns} FROM withlive_comments WHERE live_id = ? AND play_time_ms > ? ORDER BY play_time_ms, timeline_id LIMIT ?`,
		);
		this.range = database.query(
			`SELECT ${columns} FROM withlive_comments WHERE live_id = ? AND play_time_ms > ? AND play_time_ms <= ? ORDER BY play_time_ms, timeline_id LIMIT ?`,
		);
	}

	findBySecond(liveId: string, second: number): TimelineItem[] {
		const window = createCommentSecondWindow(second);
		return this.bySecond
			.all(liveId, window.startMillisecond, window.endMillisecond)
			.map(rowToTimelineItem);
	}
	findOfficialBySecond(liveId: string, second: number): OfficialTimelineItem[] {
		return this.findBySecond(liveId, second).map(toOfficialTimelineItem);
	}
	findAfterMillisecond(
		liveId: string,
		millisecond: number,
		limit: number,
	): TimelineItem[] {
		const cursor = createCommentAfterCursor(millisecond, limit);
		return this.after
			.all(liveId, cursor.playTimeMillisecond, cursor.limit)
			.map(rowToTimelineItem);
	}
	findOfficialAfterMillisecond(
		liveId: string,
		millisecond: number,
		limit: number,
	): OfficialTimelineItem[] {
		return this.findAfterMillisecond(liveId, millisecond, limit).map(
			toOfficialTimelineItem,
		);
	}
	findBetweenMilliseconds(
		liveId: string,
		fromMillisecond: number,
		toMillisecond: number,
		limit: number,
	): TimelineItem[] {
		const range = createCommentRange(fromMillisecond, toMillisecond, limit);
		return this.range
			.all(
				liveId,
				range.fromPlayTimeMillisecond,
				range.toPlayTimeMillisecond,
				range.limit,
			)
			.map(rowToTimelineItem);
	}
}
