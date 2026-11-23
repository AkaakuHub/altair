import { describe, expect, test } from 'bun:test';
import { readStaminaRecoveryRequest } from '../src/v1/requests/stamina-recovery-request.ts';

describe('stamina recovery request', () => {
	test('item回復requestを型付き入力へ変換する', () => {
		expect(
			readStaminaRecoveryRequest({
				use_recovery_type: 2,
				use_item_list: [
					{ d_item_datas_id: 'item-a', item_id: 3001001, item_num: 2 },
				],
			}),
		).toEqual({
			use_recovery_type: 2,
			use_item_list: [
				{ d_item_datas_id: 'item-a', item_id: 3001001, item_num: 2 },
			],
		});
	});

	test('省略されたitem識別子は既存通り空文字へ正規化する', () => {
		expect(
			readStaminaRecoveryRequest({
				use_recovery_type: 2,
				use_item_list: [{ item_id: 3001001, item_num: 1 }],
			}),
		).toMatchObject({
			use_item_list: [{ d_item_datas_id: '', item_id: 3001001, item_num: 1 }],
		});
	});

	test('不正な回復種別またはitem配列を拒否する', () => {
		expect(
			readStaminaRecoveryRequest({ use_recovery_type: 2 }),
		).toBeUndefined();
		expect(
			readStaminaRecoveryRequest({
				use_recovery_type: 2,
				use_item_list: [{ item_id: 3001001, item_num: 1.5 }],
			}),
		).toBeUndefined();
	});
});
