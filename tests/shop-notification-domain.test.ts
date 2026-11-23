import { describe, expect, test } from 'bun:test';
import {
	canPaySiscaBalance,
	hasLimitBreakRoom,
} from '../src/v1/route-support/shop-notification-domain.ts';

describe('shop notification domain', () => {
	test('limit break上限未満だけ交換可能と判定する', () => {
		expect(hasLimitBreakRoom(3, 4)).toBe(true);
		expect(hasLimitBreakRoom(4, 4)).toBe(false);
	});

	test('有償限定と通常購入で使用可能残高を分ける', () => {
		expect(canPaySiscaBalance(100, 20, 50, false)).toBe(true);
		expect(canPaySiscaBalance(100, 20, 50, true)).toBe(false);
		expect(canPaySiscaBalance(100, 20, 0, false)).toBe(false);
	});
});
