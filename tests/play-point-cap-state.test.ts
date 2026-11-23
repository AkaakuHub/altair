import { describe, expect, test } from 'bun:test';
import {
	PLAY_POINT_CAP_UP_ITEM_ID,
	syncGradePlayPointCap,
} from '../src/state/play-point-cap-state.ts';
import { STAMINA_RECOVERY_STOPPED_AT } from '../src/state/stamina-recovery-time.ts';
import type { UserInventoryState } from '../src/state/user-item-definition.ts';
import {
	addUserStaminaMax,
	calculateCurrentUserStamina,
	consumeUserStamina,
} from '../src/state/user-status-stamina.ts';
import type { UserStatusState } from '../src/state/user-status-types.ts';

describe('play point cap state', () => {
	test('calculates grade reward play point cap from grade point inventory', () => {
		const status = userStatus(100);

		syncGradePlayPointCap(status, gradePointInventory(1700), testCapBonus);
		expect(status.staminaMax).toBe(110);

		syncGradePlayPointCap(status, gradePointInventory(999999), testCapBonus);
		expect(status.staminaMax).toBe(200);
	});

	test('caps direct play point cap-up rewards at the current maximum', () => {
		const status = userStatus(200);

		addUserStaminaMax(status, 20);
		expect(status.staminaMax).toBe(220);

		addUserStaminaMax(status, 9999);
		expect(status.staminaMax).toBe(300);
	});

	test('calculates natural recovery from the full recovery time', () => {
		const status = userStatus(200);
		status.staminaNow = 195;
		status.staminaRecoveryTime = '2026-06-18T10:28:27.166Z';

		expect(
			calculateCurrentUserStamina(status, new Date('2026-06-18T09:58:50.000Z')),
		).toEqual({
			staminaNow: 195,
			staminaMax: 200,
			staminaRecoveryTime: '2026-06-18T10:28:27.166Z',
		});
		expect(
			calculateCurrentUserStamina(status, new Date('2026-06-18T10:28:27.166Z')),
		).toEqual({
			staminaNow: 200,
			staminaMax: 200,
			staminaRecoveryTime: STAMINA_RECOVERY_STOPPED_AT,
		});
	});

	test('does not recover naturally beyond stamina max', () => {
		const status = userStatus(100);
		status.staminaNow = 4;
		status.staminaRecoveryTime = '2026-06-18T10:00:00.000Z';

		expect(
			calculateCurrentUserStamina(status, new Date('2026-06-18T10:24:00.000Z')),
		).toEqual({
			staminaNow: 100,
			staminaMax: 100,
			staminaRecoveryTime: STAMINA_RECOVERY_STOPPED_AT,
		});
	});

	test('consumes play point after applying natural recovery', () => {
		const status = userStatus(100);
		status.staminaNow = 95;
		status.staminaRecoveryTime = '2026-06-18T10:00:00.000Z';

		expect(
			consumeUserStamina(status, 10, new Date('2026-06-18T09:30:00.000Z')),
		).toBe(true);
		expect(status.staminaNow).toBe(85);
		expect(status.staminaRecoveryTime).toBe('2026-06-18T11:00:00.000Z');
	});
});

function userStatus(staminaMax: number): UserStatusState {
	return {
		playerId: 'player',
		jewelFree: 0,
		jewelPaidApple: 0,
		jewelPaidGoogle: 0,
		jewelStaminaRecoveryCount: 0,
		jewelStaminaRecoveryGameDate: null,
		staminaNow: 100,
		staminaMax,
		staminaRecoveryTime: STAMINA_RECOVERY_STOPPED_AT,
		seasonFanLevelSeasonId: 0,
		seasonFanLevelPointStock: 0,
		seasonFanLevelPointStockLimit: 0,
		memberFanLevels: [],
		seasonFanLevels: [],
		fanLevelEarnProgresses: [],
	};
}

function testCapBonus(gradePoint: number): number {
	return gradePoint >= 999999 ? 100 : 10;
}

function gradePointInventory(itemNum: number): UserInventoryState {
	return {
		playerId: 'player',
		itemCategoryList: [
			{
				itemCategory: 0,
				userItemList: [
					{
						userItemId: 'grade-point',
						itemId: 1005001,
						itemNum,
						itemType: 8,
						limitDateTime: null,
						rarity: 1,
						resourceFileName: '',
					},
					{
						userItemId: 'cap-up',
						itemId: PLAY_POINT_CAP_UP_ITEM_ID,
						itemNum: 9999,
						itemType: 3,
						limitDateTime: null,
						rarity: 4,
						resourceFileName: '',
					},
				],
			},
		],
	};
}
