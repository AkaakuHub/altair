import { describe, expect, test } from 'bun:test';
import {
	createCircleCreateLockedResponse,
	createCircleResultResponse,
} from '../src/v1/route-support/circle-route-responses.ts';

describe('circle route responses', () => {
	test('action resultを公式fieldへ変換する', () =>
		expect(createCircleResultResponse(false)).toEqual({ result: false }));
	test('grand prix中のcreate拒否応答を維持する', () =>
		expect(createCircleCreateLockedResponse()).toMatchObject({
			error_code: '06040_010405',
			title: 'サークル操作実行エラー',
		}));
});
