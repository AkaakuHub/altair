import { describe, expect, test } from 'bun:test';
import { ja } from '@altair/admin-ui/i18n/messages/ja.ts';
import {
	createUserStatusForm,
	userStatusFormValues,
} from '@altair/admin-ui/ui/features/user-status/user-status-form.ts';
import {
	seasonOptionsWithCurrent,
	selectSeasonFanLevel,
	updateMemberFanLevel,
} from '@altair/admin-ui/ui/features/user-status/user-status-model.ts';
import type { AdminUserStatusView } from '@altair/runtime/admin/dto/admin-user-status-view-schema.ts';

describe('user status model', () => {
	test('保存対象外の表示値だけの変更をdraftへ持ち込まない', () => {
		const source = createStatus();
		expect(
			createUserStatusForm({
				...source,
				presentBoxCount: source.presentBoxCount + 1,
				jewelStaminaRecoveryGameDate: '2026-10-23',
			}),
		).toEqual(createUserStatusForm(source));
	});
	test('シーズン経験値が空欄でもメンバーレベルの経験値連動を維持する', () => {
		const form = createUserStatusForm(createStatus());
		const member = form.memberFanLevels[0];
		if (member === undefined) throw new Error('member is missing');
		form.memberFanLevels = [{ ...member, dSeasonFanExperience: '' }];
		const updated = updateMemberFanLevel(
			form,
			0,
			{ memberFanLevel: '8' },
			[
				{ level: 1, experience: 0, cumulativeExperience: 0 },
				{ level: 8, experience: 80, cumulativeExperience: 80 },
			],
			[],
		);
		expect(updated.memberFanLevels[0]).toMatchObject({
			memberFanLevel: '8',
			memberFanExperience: '80',
			dSeasonFanExperience: '',
		});
	});
	test('ファン経験値の空欄を0へ戻さず保持する', () => {
		const form = createUserStatusForm(createStatus());
		const updated = updateMemberFanLevel(
			form,
			0,
			{ memberFanExperience: '' },
			[],
			[],
		);
		expect(updated.memberFanLevels[0]?.memberFanExperience).toBe('');
	});
	test('シーズンを往復しても入力途中の空欄を保持する', () => {
		const form = {
			...createUserStatusForm(createStatus()),
			seasonFanLevelPointStock: '',
		};
		const selected = selectSeasonFanLevel(form, 2);
		expect(selectSeasonFanLevel(selected, 1).seasonFanLevelPointStock).toBe('');
	});
	test('スタミナ回復日時の空欄を停止操作として送信する', () => {
		const form = createUserStatusForm(createStatus());
		form.staminaRecoveryTime = { ...form.staminaRecoveryTime, value: '' };
		expect(userStatusFormValues('player-1', form, ja).staminaRecoveryTime).toBe(
			'',
		);
	});
	test('current seasonがmaster listにない場合も選択肢へ残す', () => {
		expect(seasonOptionsWithCurrent([], 10512, 'Unknown season')).toEqual([
			{
				seasonId: 10512,
				name: 'Unknown season',
				startTime: '',
				endTime: '',
				isSeasonFanLv: false,
			},
		]);
	});

	test('masterにあるシーズン名は翻訳用の未登録名で上書きしない', () => {
		const seasons = [
			{
				seasonId: 2,
				name: 'Sample season',
				startTime: '',
				endTime: '',
				isSeasonFanLv: true,
			},
		];
		expect(seasonOptionsWithCurrent(seasons, 2, 'Unknown season')).toBe(
			seasons,
		);
	});

	test('season切替時に現在値を保存して選択seasonの値を読む', () => {
		const selected = selectSeasonFanLevel(
			createUserStatusForm(createStatus()),
			2,
		);

		expect(selected.seasonFanLevelPointStock).toBe('20');
		expect(selected.memberFanLevels[0]).toMatchObject({
			dSeasonFanLevel: '4',
			dSeasonFanExperience: '40',
		});
		expect(selected.seasonFanLevels).toContainEqual({
			seasonId: 1,
			pointStock: '10',
			pointStockLimit: '100',
			memberFanLevels: [
				{ characterId: 10, dSeasonFanLevel: '3', dSeasonFanExperience: '30' },
			],
		});
	});

	test('admin endpointのfield名を生成する', () => {
		expect(
			userStatusFormValues(
				'player-1',
				createUserStatusForm(createStatus()),
				ja,
			),
		).toMatchObject({
			playerId: 'player-1',
			seasonFanLevelSeasonId: 1,
			'dSeasonFanLevel:10': 3,
			'dSeasonFanExperience:10': 30,
			'memberFanLevel:10': 7,
			'memberFanExperience:10': 70,
		});
	});
});

function createStatus(): AdminUserStatusView {
	return {
		fanLevel: 7,
		jewelFree: 1,
		jewelPaidApple: 2,
		jewelPaidGoogle: 3,
		jewelStaminaRecoveryCount: 4,
		jewelStaminaRecoveryGameDate: null,
		presentBoxCount: 5,
		staminaNow: 90,
		staminaMax: 100,
		staminaRecoveryTime: '2026-07-11T00:00:00Z',
		seasonFanLevelSeasonId: 1,
		seasonFanLevelPointStock: 10,
		seasonFanLevelPointStockLimit: 100,
		memberFanLevels: [
			{
				characterId: 10,
				dSeasonFanLevel: 3,
				dSeasonFanExperience: 30,
				memberFanLevel: 7,
				memberFanExperience: 70,
			},
		],
		seasonFanLevels: [
			{
				seasonId: 2,
				pointStock: 20,
				pointStockLimit: 200,
				memberFanLevels: [
					{ characterId: 10, dSeasonFanLevel: 4, dSeasonFanExperience: 40 },
				],
			},
		],
		fanLevelEarnProgresses: [],
	};
}
