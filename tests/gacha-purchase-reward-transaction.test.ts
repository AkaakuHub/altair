import { describe, expect, test } from 'bun:test';
import { runGachaPurchaseRewardTransaction } from '../src/v1/route-support/gacha-purchase-reward-transaction.ts';

describe('gacha purchase reward transaction', () => {
	test('receipt、cost、paid-only、planの順に適用する', () => {
		const order: string[] = [];
		const result = runGachaPurchaseRewardTransaction({
			applyReceipt: () => {
				order.push('receipt');
				return 'result';
			},
			consumeCost: () => order.push('cost'),
			recordPaidOnlyProgress: () => order.push('paid-only'),
			consumeStoredPlan: () => order.push('plan'),
		});
		expect(result).toBe('result');
		expect(order).toEqual(['receipt', 'cost', 'paid-only', 'plan']);
	});

	test('receipt失敗時は後続mutationを実行しない', () => {
		const order: string[] = [];
		expect(
			runGachaPurchaseRewardTransaction({
				applyReceipt: () => undefined,
				consumeCost: () => order.push('cost'),
			}),
		).toBeUndefined();
		expect(order).toEqual([]);
	});
});
