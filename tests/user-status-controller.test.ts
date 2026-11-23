import { describe, expect, test } from 'bun:test';
import { createUserStatusController } from '../src/application/user-status-controller.ts';
import { createServerState } from '../src/server-state.ts';
import { createNoopServerStateStore } from '../src/server-state-store-port.ts';
import type { UserStatusState } from '../src/state/user-status-types.ts';
import { testServerRuntimeDefaults } from './server-runtime-defaults.ts';

const firstMasterRelease = createUserStatusController(
	[
		{ characterId: 10, dSeasonFanLevel: 1, memberFanLevel: 1 },
		{ characterId: 20, dSeasonFanLevel: 1, memberFanLevel: 1 },
	],
	[
		{ characterId: 10, memberFanLevel: 1 },
		{ characterId: 30, memberFanLevel: 0 },
	],
);
const secondMasterRelease = createUserStatusController(
	[
		{ characterId: 30, dSeasonFanLevel: 1, memberFanLevel: 1 },
		{ characterId: 10, dSeasonFanLevel: 1, memberFanLevel: 1 },
	],
	[{ characterId: 20, memberFanLevel: 1 }],
);

describe('user status controller', () => {
	test('projects one existing user through each selected master release', () => {
		const status = createStatus();

		expect(firstMasterRelease.getCurrentSeasonMemberFanLevels(status)).toEqual([
			{
				characterId: 10,
				dSeasonFanLevel: 8,
				dSeasonFanExperience: 80,
				memberFanLevel: 7,
				memberFanExperience: 70,
			},
			{
				characterId: 20,
				dSeasonFanLevel: 1,
				dSeasonFanExperience: 0,
				memberFanLevel: 1,
				memberFanExperience: 0,
			},
		]);
		expect(secondMasterRelease.getCurrentSeasonMemberFanLevels(status)).toEqual(
			[
				{
					characterId: 30,
					dSeasonFanLevel: 1,
					dSeasonFanExperience: 0,
					memberFanLevel: 1,
					memberFanExperience: 0,
				},
				{
					characterId: 10,
					dSeasonFanLevel: 8,
					dSeasonFanExperience: 80,
					memberFanLevel: 7,
					memberFanExperience: 70,
				},
			],
		);
		expect(firstMasterRelease.getCardMemberFanLevels(status)).toEqual([
			{ characterId: 10, memberFanLevel: 7 },
			{ characterId: 30, memberFanLevel: 0 },
		]);
		expect(secondMasterRelease.getCardMemberFanLevels(status)).toEqual([
			{ characterId: 20, memberFanLevel: 1 },
		]);
		expect(status.memberFanLevels).toHaveLength(1);
	});

	test('masterに存在する未保存memberへfan experienceを追加する', () => {
		const status = createStatus();

		expect(
			firstMasterRelease.addMemberFanExperience(status, 20, 1_000, [
				{ level: 1, experience: 0, cumulativeExperience: 0 },
				{ level: 2, experience: 1_000, cumulativeExperience: 1_000 },
			]),
		).toEqual({ beforeLevel: 1, beforeExperience: 0 });
		expect(
			status.memberFanLevels.find((level) => level.characterId === 20),
		).toEqual({
			characterId: 20,
			dSeasonFanLevel: 1,
			dSeasonFanExperience: 0,
			memberFanLevel: 2,
			memberFanExperience: 1_000,
		});
	});

	test('preserves hidden character progress while another master release is edited', () => {
		const masterReleaseA = createUserStatusController(
			[{ characterId: 10, dSeasonFanLevel: 1, memberFanLevel: 1 }],
			[],
		);
		const masterReleaseB = createUserStatusController(
			[{ characterId: 30, dSeasonFanLevel: 1, memberFanLevel: 1 }],
			[],
		);
		const state = createServerState(
			createNoopServerStateStore(),
			[],
			[],
			testServerRuntimeDefaults,
			() => masterReleaseA,
		);
		const user = {
			playerId: 'player-1',
			deviceSpecificId: 'device-1',
			sessionToken: 'session-1',
			playerName: 'Player',
			birthday: '2000-01-01',
			entryTime: '2026-01-01T00:00:00.000Z',
			lastLoginDate: '2026-01-01T00:00:00.000Z',
			playerLevel: 1,
			platformType: 1,
		};
		state.registeredUsers = [user];
		state.userStatuses = [];

		const aView = masterReleaseA.getView(state, user);
		expect(
			masterReleaseA.update(state, user.playerId, {
				...toUpdateValues(aView),
				memberFanLevels: [
					{
						characterId: 10,
						memberFanLevel: 12,
						memberFanExperience: 1_200,
						dSeasonFanLevel: 8,
						dSeasonFanExperience: 800,
					},
				],
			}),
		).toBe(true);

		const bView = masterReleaseB.getView(state, user);
		expect(bView.memberFanLevels.map((level) => level.characterId)).toEqual([
			30,
		]);
		expect(
			masterReleaseB.update(state, user.playerId, {
				...toUpdateValues(bView),
				memberFanLevels: [
					{
						characterId: 30,
						memberFanLevel: 4,
						memberFanExperience: 400,
						dSeasonFanLevel: 3,
						dSeasonFanExperience: 300,
					},
				],
			}),
		).toBe(true);

		expect(masterReleaseA.getView(state, user).memberFanLevels).toEqual([
			{
				characterId: 10,
				memberFanLevel: 12,
				memberFanExperience: 1_200,
				dSeasonFanLevel: 8,
				dSeasonFanExperience: 800,
			},
		]);
		expect(state.userStatuses[0]?.memberFanLevels).toEqual([
			{
				characterId: 10,
				memberFanLevel: 12,
				memberFanExperience: 1_200,
				dSeasonFanLevel: 8,
				dSeasonFanExperience: 800,
			},
			{
				characterId: 30,
				memberFanLevel: 4,
				memberFanExperience: 400,
				dSeasonFanLevel: 3,
				dSeasonFanExperience: 300,
			},
		]);
	});

	test('raw season migration keeps progress outside the selected master release', () => {
		const status = createStatus();
		status.memberFanLevels.push({
			characterId: 30,
			dSeasonFanLevel: 1,
			dSeasonFanExperience: 0,
			memberFanLevel: 1,
			memberFanExperience: 0,
		});
		status.seasonFanLevels = [];
		const selectedMasterRelease = createUserStatusController(
			[{ characterId: 30, dSeasonFanLevel: 1, memberFanLevel: 1 }],
			[],
		);

		selectedMasterRelease.migrateSeasonFanLevels(status);

		expect(status.memberFanLevels).toEqual([
			{
				characterId: 10,
				dSeasonFanLevel: 3,
				dSeasonFanExperience: 30,
				memberFanLevel: 7,
				memberFanExperience: 70,
			},
		]);
		expect(status.seasonFanLevels).toEqual([
			{
				seasonId: 1,
				pointStock: 0,
				pointStockLimit: 0,
				memberFanLevels: [
					{
						characterId: 10,
						dSeasonFanLevel: 3,
						dSeasonFanExperience: 30,
					},
				],
			},
		]);
	});
});

function toUpdateValues(
	view: ReturnType<typeof firstMasterRelease.getView>,
): Parameters<typeof firstMasterRelease.update>[2] {
	return {
		jewelFree: view.jewelFree,
		jewelPaidApple: view.jewelPaidApple,
		jewelPaidGoogle: view.jewelPaidGoogle,
		jewelStaminaRecoveryCount: view.jewelStaminaRecoveryCount,
		jewelStaminaRecoveryGameDate: view.jewelStaminaRecoveryGameDate,
		staminaNow: view.staminaNow,
		staminaMax: view.staminaMax,
		staminaRecoveryTime: view.staminaRecoveryTime,
		seasonFanLevelSeasonId: view.seasonFanLevelSeasonId,
		seasonFanLevelPointStock: view.seasonFanLevelPointStock,
		seasonFanLevelPointStockLimit: view.seasonFanLevelPointStockLimit,
		memberFanLevels: view.memberFanLevels,
		fanLevelEarnProgresses: view.fanLevelEarnProgresses,
	};
}

function createStatus(): UserStatusState {
	return {
		playerId: 'player-1',
		jewelFree: 0,
		jewelPaidApple: 0,
		jewelPaidGoogle: 0,
		jewelStaminaRecoveryCount: 0,
		jewelStaminaRecoveryGameDate: null,
		staminaNow: 100,
		staminaMax: 100,
		staminaRecoveryTime: '9999-12-31T23:59:59.999Z',
		seasonFanLevelSeasonId: 1,
		seasonFanLevelPointStock: 0,
		seasonFanLevelPointStockLimit: 0,
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
				seasonId: 1,
				pointStock: 0,
				pointStockLimit: 0,
				memberFanLevels: [
					{
						characterId: 10,
						dSeasonFanLevel: 8,
						dSeasonFanExperience: 80,
					},
				],
			},
		],
		fanLevelEarnProgresses: [],
	};
}
