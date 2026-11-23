import { describe, expect, test } from 'bun:test';
import {
	getGachaSeriesTimeLimitEndTime,
	isGachaSeriesOpen,
} from '../src/application/gacha-series-summary.ts';

const schedule = {
	startTime: '2026-07-11T10:00:00.000Z',
	endTime: '2026-07-11T12:00:00.000Z',
	timeLimitType: 0,
	availableTimeHours: 0,
};

describe('gacha series summary', () => {
	test('開始時刻を含み終了時刻を含まない期間を開催中と判定する', () => {
		expect(isGachaSeriesOpen(schedule, schedule.startTime)).toBe(true);
		expect(isGachaSeriesOpen(schedule, schedule.endTime)).toBe(false);
	});

	test('利用時間制限がある場合だけ現在時刻から終了時刻を求める', () => {
		expect(
			getGachaSeriesTimeLimitEndTime(
				{ ...schedule, timeLimitType: 1, availableTimeHours: 3 },
				'2026-07-11T10:30:00.000Z',
			),
		).toBe('2026-07-11T13:30:00.000Z');
		expect(
			getGachaSeriesTimeLimitEndTime(schedule, '2026-07-11T10:30:00.000Z'),
		).toBeNull();
	});
});
