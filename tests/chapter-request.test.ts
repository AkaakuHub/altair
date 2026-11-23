import { describe, expect, test } from 'bun:test';
import {
	readChapterCategoryRequest,
	readChapterClaimRequest,
} from '../src/v1/route-support/chapter-request.ts';

describe('chapter request', () => {
	test('number fieldとcurrent point defaultを維持する', () => {
		expect(readChapterCategoryRequest({ category_id: 10 })).toEqual({
			categoryId: 10,
		});
		expect(readChapterClaimRequest({ current_point: '20' })).toEqual({
			currentPoint: 0,
		});
	});
});
