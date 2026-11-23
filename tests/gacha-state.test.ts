import { describe, expect, test } from 'bun:test';
import { ensureUserGachaState } from '../src/state/gacha-aggregate-state.ts';
import { exchangeGachaGuaranteePointItem } from '../src/state/gacha-guarantee-exchange-state.ts';
import { resolveGachaGuaranteeExchangeItems } from '../src/state/gacha-guarantee-ownership.ts';
import { migrateUserGachaState } from '../src/state-migrations/user-gacha-state-migration.ts';

describe('gacha state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userGachas: [] };

		const first = ensureUserGachaState(state, 'player-a');
		const second = ensureUserGachaState(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
	});

	test('removes copied guarantee master defaults while preserving progress', () => {
		const state = { userGachas: [] };
		const userGacha = ensureUserGachaState(state, 'player-a').value;
		userGacha.guaranteeExchangeItemList = [
			{
				exchangePointRateId: 1,
				isHaving: false,
				remainingExchangeNum: -1,
			},
			{
				exchangePointRateId: 2,
				isHaving: true,
				remainingExchangeNum: 3,
			},
		];

		migrateUserGachaState(userGacha);

		expect(userGacha.guaranteeExchangeItemList).toEqual([
			{
				exchangePointRateId: 2,
				isHaving: true,
				remainingExchangeNum: 3,
			},
		]);
	});

	test('does not guess provenance for a legacy purchase plan', () => {
		const state = { userGachas: [] };
		const userGacha = ensureUserGachaState(state, 'player-a').value;
		userGacha.purchasePlans = [
			{
				gachaSeriesId: 1055003,
				cardDatasIds: [10313050],
				bonusResults: [
					{
						order_id: 1,
						grade: 1,
						gacha_bonus_item_result_list: [{ item_id: 3001001 }],
					},
				],
			},
		];

		migrateUserGachaState(userGacha);

		expect(userGacha.purchasePlans).toHaveLength(1);
		expect(userGacha.purchasePlans[0]?.masterReleaseId).toBeUndefined();
	});

	test('resolves guarantee items from selected master without copying them', () => {
		const state = { userGachas: [] };
		const userGacha = ensureUserGachaState(state, 'player-a').value;
		userGacha.guaranteeExchangeItemList = [
			{
				exchangePointRateId: 1,
				isHaving: true,
				remainingExchangeNum: 0,
			},
			{
				exchangePointRateId: 2,
				isHaving: true,
				remainingExchangeNum: 3,
			},
		];

		const resolved = resolveGachaGuaranteeExchangeItems(userGacha, [
			{
				exchangePointRateId: 2,
				isHaving: false,
				remainingExchangeNum: -1,
			},
			{
				exchangePointRateId: 3,
				isHaving: false,
				remainingExchangeNum: -1,
			},
		]);

		expect(resolved).toEqual([
			{
				exchangePointRateId: 2,
				isHaving: true,
				remainingExchangeNum: 3,
			},
			{
				exchangePointRateId: 3,
				isHaving: false,
				remainingExchangeNum: -1,
			},
		]);
		expect(userGacha.guaranteeExchangeItemList).toHaveLength(2);
	});

	test('報酬preflight失敗時は保証pointと交換回数を変更しない', () => {
		const userGacha = ensureUserGachaState(
			{ userGachas: [] },
			'player-a',
		).value;
		userGacha.seriesProgressList = [
			{ gachaSeriesId: 10, userExchangePointNum: 100, userSeriesExecCount: 1 },
		];

		const result = exchangeGachaGuaranteePointItem(
			userGacha,
			{ playerId: 'player-a', userCardDataList: [] },
			() => undefined,
			{
				exchangePointRateId: 20,
				exchangePointId: 30,
				gachaSeriesId: 10,
				exchangeItemType: 3,
				exchangeItemId: 40,
				exchangeItemQuantity: 1,
				exchangePrice: 50,
				limitedCount: 1,
			},
			{
				sourceMasterReleaseId: 'release-a',
				identityFingerprint: { domain: 'gacha-series', value: 'series-10' },
			},
			() => undefined,
			() => false,
		);

		expect(result).toBeUndefined();
		expect(userGacha.seriesProgressList[0]?.userExchangePointNum).toBe(100);
		expect(userGacha.guaranteeExchangeItemList).toEqual([]);
	});
});
