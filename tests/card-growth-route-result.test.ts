import { describe, expect, test } from 'bun:test';
import {
	cardGrowthMutationErrorCode,
	createCardGrowthMutationResponse,
} from '../src/v1/route-support/card-growth-route-result.ts';

describe('card growth route result', () => {
	test('domain resultを既存route errorへ変換する', () => {
		const cases = [
			['cardNotFound', 'userCardNotFound'],
			['masterDataNotFound', 'userCardGrowthNotFound'],
			['insufficientItem', 'userItemInsufficient'],
			['incompatibleDefinition', 'userOwnedEntityIncompatible'],
		] as const;
		for (const [result, expected] of cases) {
			expect(
				cardGrowthMutationErrorCode(result, 'userCardGrowthNotFound'),
			).toBe(expected);
		}
		expect(
			cardGrowthMutationErrorCode(
				'unavailable',
				'userCardLimitBreakUnavailable',
			),
		).toBe('userCardLimitBreakUnavailable');
		expect(
			cardGrowthMutationErrorCode('ok', 'userCardGrowthNotFound'),
		).toBeUndefined();
	});

	test('成功responseの公式形状を返す', () => {
		expect(createCardGrowthMutationResponse()).toEqual({ result: true });
	});
});
