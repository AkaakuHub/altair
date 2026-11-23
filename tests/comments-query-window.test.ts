import { describe, expect, test } from 'bun:test';
import {
	createCommentAfterCursor,
	createCommentRange,
	createCommentSecondWindow,
} from '../src/v1/comments-query-window.ts';
import { toOfficialTimelineItem } from '../src/v1/comments-row-mapper.ts';

describe('comments query projection', () => {
	test('secondを左閉右開のmillisecond範囲へ変換する', () => {
		expect(createCommentSecondWindow(12)).toEqual({
			startMillisecond: 12000,
			endMillisecond: 13000,
		});
	});
	test('cursorとlimitを変更しない', () => {
		expect(createCommentAfterCursor(1234, 50)).toEqual({
			playTimeMillisecond: 1234,
			limit: 50,
		});
	});
	test('コメント取得範囲とlimitを変更しない', () => {
		expect(createCommentRange(1234, 9234, 500)).toEqual({
			fromPlayTimeMillisecond: 1234,
			toPlayTimeMillisecond: 9234,
			limit: 500,
		});
	});
	test('official itemから内部playback fieldだけを除外する', () => {
		const official = toOfficialTimelineItem({
			timeline_id: 'a',
			play_time_ms: 1000,
			play_time_second: 1,
			body: 'text',
		});
		expect(official).toMatchObject({ timeline_id: 'a', body: 'text' });
		expect(Object.hasOwn(official, 'play_time_ms')).toBe(true);
		expect(Object.hasOwn(official, 'play_time_second')).toBe(true);
	});
});
