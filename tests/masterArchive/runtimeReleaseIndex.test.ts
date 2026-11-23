import { describe, expect, test } from 'bun:test';
import {
	mergeRuntimeReleaseIndexes,
	parseRuntimeReleaseIndex,
	resolveRuntimeReleaseId,
} from '../../src/master-archive/domain/runtime-release-index.ts';

const olderReleaseId = '1'.repeat(64);
const newerReleaseId = '2'.repeat(64);

describe('mergeRuntimeReleaseIndexes', () => {
	test('新しいreleaseを追加しても保存済みの過去releaseを保持する', () => {
		const existing = parseRuntimeReleaseIndex({
			[olderReleaseId]: {
				android: 'R2606100@MVUWvzmloZqHgjY6LMlGtcDXYQ==',
				ios: 'R2606100@SluahIGk1pjilFFncIJp6+DWYQ==',
			},
		});
		const additions = parseRuntimeReleaseIndex({
			[newerReleaseId]: {
				android: 'R2606100@xjG+5dyrkXdtv7co914JYsDXYQ==',
				ios: 'R2606100@P+q/CZ6smWPID3L9DwYIptDWYQ==',
			},
		});

		expect(mergeRuntimeReleaseIndexes(existing, additions)).toEqual({
			[olderReleaseId]: {
				android: 'R2606100@MVUWvzmloZqHgjY6LMlGtcDXYQ==',
				ios: 'R2606100@SluahIGk1pjilFFncIJp6+DWYQ==',
			},
			[newerReleaseId]: {
				android: 'R2606100@xjG+5dyrkXdtv7co914JYsDXYQ==',
				ios: 'R2606100@P+q/CZ6smWPID3L9DwYIptDWYQ==',
			},
		});
	});

	test('同じrelease IDに異なるversionを割り当てない', () => {
		const existing = parseRuntimeReleaseIndex({
			[olderReleaseId]: {
				android: 'R2606100@MVUWvzmloZqHgjY6LMlGtcDXYQ==',
				ios: 'R2606100@SluahIGk1pjilFFncIJp6+DWYQ==',
			},
		});
		const additions = parseRuntimeReleaseIndex({
			[olderReleaseId]: {
				android: 'R2606100@xjG+5dyrkXdtv7co914JYsDXYQ==',
				ios: 'R2606100@P+q/CZ6smWPID3L9DwYIptDWYQ==',
			},
		});

		expect(() => mergeRuntimeReleaseIndexes(existing, additions)).toThrow(
			`Runtime release index conflicts for ${olderReleaseId}`,
		);
	});
});

test('resource version pairから保存済みrelease IDを一意に解決する', () => {
	const index = parseRuntimeReleaseIndex({
		[olderReleaseId]: {
			android: 'R2606100@MVUWvzmloZqHgjY6LMlGtcDXYQ==',
			ios: 'R2606100@SluahIGk1pjilFFncIJp6+DWYQ==',
		},
	});
	expect(
		resolveRuntimeReleaseId(index, {
			android: 'R2606100@MVUWvzmloZqHgjY6LMlGtcDXYQ==',
			ios: 'R2606100@SluahIGk1pjilFFncIJp6+DWYQ==',
		}),
	).toBe(olderReleaseId);
});
