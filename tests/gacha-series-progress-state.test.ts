import { describe, expect, test } from 'bun:test';
import {
	canPurchasePaidOnlyGacha,
	recordPaidOnlyGachaPurchase,
	setGachaSeriesProgress,
} from '../src/state/gacha-series-progress-state.ts';
import type { UserGachaState } from '../src/state/gacha-types.ts';

const oldProvenance = {
	sourceMasterReleaseId: 'old',
	identityFingerprint: { domain: 'gacha-series', value: 'old' },
};
const newProvenance = {
	sourceMasterReleaseId: 'new',
	identityFingerprint: { domain: 'gacha-series', value: 'new' },
};

describe('gacha series progress state', () => {
	test('series進捗とpaid-only購入日を独立して更新する', () => {
		const state = createUserGachaState();

		expect(setGachaSeriesProgress(state, 10, 20, 30, oldProvenance)).toBe(true);
		expect(state.seriesProgressList).toEqual([
			{
				...oldProvenance,
				gachaSeriesId: 10,
				userExchangePointNum: 20,
				userSeriesExecCount: 30,
			},
		]);
		expect(
			canPurchasePaidOnlyGacha(state, 10, '2026-07-11', oldProvenance),
		).toBe(true);
		recordPaidOnlyGachaPurchase(state, 10, '2026-07-11', oldProvenance);
		recordPaidOnlyGachaPurchase(state, 10, '2026-07-11', oldProvenance);
		expect(
			canPurchasePaidOnlyGacha(state, 10, '2026-07-11', oldProvenance),
		).toBe(false);
		expect(state.paidOnlyPurchaseList).toEqual([
			{ ...oldProvenance, gachaSeriesId: 10, gameDate: '2026-07-11' },
		]);
	});

	test('同じseries IDの異なるidentityを往復して保持する', () => {
		const state = createUserGachaState();
		expect(setGachaSeriesProgress(state, 10, 20, 30, oldProvenance)).toBe(true);
		expect(setGachaSeriesProgress(state, 10, 40, 50, newProvenance)).toBe(true);

		expect(state.seriesProgressList).toHaveLength(2);
		expect(
			state.seriesProgressList.find(
				(progress) => progress.sourceMasterReleaseId === 'old',
			)?.userExchangePointNum,
		).toBe(20);
		expect(
			state.seriesProgressList.find(
				(progress) => progress.sourceMasterReleaseId === 'new',
			)?.userExchangePointNum,
		).toBe(40);

		recordPaidOnlyGachaPurchase(state, 10, '2026-07-11', oldProvenance);
		expect(
			canPurchasePaidOnlyGacha(state, 10, '2026-07-11', newProvenance),
		).toBe(true);
	});

	test('legacy進捗を保持してmaster release進捗の基準値にする', () => {
		const state = createUserGachaState();
		state.seriesProgressList = [
			{
				gachaSeriesId: 10,
				userExchangePointNum: 20,
				userSeriesExecCount: 30,
			},
		];

		expect(setGachaSeriesProgress(state, 10, 21, 31, newProvenance)).toBe(true);
		expect(state.seriesProgressList).toHaveLength(2);
		expect(state.seriesProgressList[0]?.identityFingerprint).toBeUndefined();
		expect(state.seriesProgressList[1]).toMatchObject({
			...newProvenance,
			userExchangePointNum: 21,
			userSeriesExecCount: 31,
		});
	});

	test('legacy paid-only履歴はexact履歴がないmaster releaseでも基準にする', () => {
		const state = createUserGachaState();
		state.paidOnlyPurchaseList = [
			{ gachaSeriesId: 10, gameDate: '2026-07-11' },
		];

		expect(
			canPurchasePaidOnlyGacha(state, 10, '2026-07-11', newProvenance),
		).toBe(false);
		expect(state.paidOnlyPurchaseList).toHaveLength(1);
	});

	test('不正なseries進捗ではaggregateを変更しない', () => {
		const state = createUserGachaState();
		expect(setGachaSeriesProgress(state, 0, 1, 1, oldProvenance)).toBe(false);
		expect(setGachaSeriesProgress(state, 10, -1, 1, oldProvenance)).toBe(false);
		expect(state.seriesProgressList).toEqual([]);
	});
});

function createUserGachaState(): UserGachaState {
	return {
		playerId: 'player-a',
		seriesProgressList: [],
		resultHistoryList: [],
		guaranteeExchangeItemList: [],
		exchangeCardList: [],
		purchasePlans: [],
		paidOnlyPurchaseList: [],
	};
}
