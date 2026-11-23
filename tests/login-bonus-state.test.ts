import { describe, expect, test } from 'bun:test';
import {
	jstGameDate,
	nextJstGameDateBoundaryIsoDateTime,
} from '../src/master-data/master-time.ts';
import { refreshDailyLoginBonusState } from '../src/state/login-bonus-progress-state.ts';
import { receiveLoginBonuses } from '../src/state/login-bonus-receive-flow.ts';
import {
	isLoginBonusActivationState,
	isLoginBonusProgressState,
} from '../src/state/login-bonus-validator.ts';

describe('login bonus state', () => {
	test('uses 04:00 JST as the game date boundary', () => {
		expect(jstGameDate(new Date('2026-06-16T18:59:59.000Z'))).toBe(
			'2026-06-16',
		);
		expect(jstGameDate(new Date('2026-06-16T19:00:00.000Z'))).toBe(
			'2026-06-17',
		);
		expect(
			nextJstGameDateBoundaryIsoDateTime(new Date('2026-06-16T18:59:59.000Z')),
		).toBe('2026-06-17T04:00:00+09:00');
		expect(
			nextJstGameDateBoundaryIsoDateTime(new Date('2026-06-16T19:00:00.000Z')),
		).toBe('2026-06-18T04:00:00+09:00');
	});

	test('receives once per game date and advances after the boundary', () => {
		const maxDayCountByLoginBonusId = new Map([[201001, 3]]);
		const firstReceive = receiveLoginBonuses(
			[],
			[201001],
			maxDayCountByLoginBonusId,
			'2026-06-16',
		);
		expect(firstReceive.progresses).toEqual([
			{
				loginBonusId: 201001,
				receivedCount: 1,
				isReceivedToday: true,
				receivedGameDate: '2026-06-16',
			},
		]);
		expect(firstReceive.receivedNowLoginBonusIds).toEqual(new Set([201001]));

		const secondReceive = receiveLoginBonuses(
			firstReceive.progresses,
			[201001],
			maxDayCountByLoginBonusId,
			'2026-06-16',
		);
		expect(secondReceive.progresses).toEqual(firstReceive.progresses);
		expect(secondReceive.receivedNowLoginBonusIds).toEqual(new Set());

		const nextDayReceive = receiveLoginBonuses(
			secondReceive.progresses,
			[201001],
			maxDayCountByLoginBonusId,
			'2026-06-17',
		);
		expect(nextDayReceive.progresses).toEqual([
			{
				loginBonusId: 201001,
				receivedCount: 2,
				isReceivedToday: true,
				receivedGameDate: '2026-06-17',
			},
		]);
		expect(nextDayReceive.receivedNowLoginBonusIds).toEqual(new Set([201001]));
	});

	test('refreshes received state when the game date changes', () => {
		const state = {
			isLoginBonusReceived: true,
			loginBonusActivations: [{ loginBonusId: 201001, isEnabled: true }],
			loginBonusProgresses: [
				{
					loginBonusId: 201001,
					receivedCount: 1,
					isReceivedToday: true,
					receivedGameDate: '2026-06-16',
				},
			],
		};
		refreshDailyLoginBonusState(
			state,
			state.loginBonusActivations,
			'2026-06-17',
			new Map([[201001, 3]]),
		);
		expect(state.isLoginBonusReceived).toBe(false);
		expect(state.loginBonusProgresses).toEqual([
			{
				loginBonusId: 201001,
				receivedCount: 1,
				isReceivedToday: false,
				receivedGameDate: '2026-06-16',
			},
		]);
	});

	test('does not receive completed login bonuses again after the boundary', () => {
		const maxDayCountByLoginBonusId = new Map([[201001, 3]]);
		const completedProgress = [
			{
				loginBonusId: 201001,
				receivedCount: 3,
				isReceivedToday: true,
				receivedGameDate: '2026-06-16',
			},
		];
		const receive = receiveLoginBonuses(
			completedProgress,
			[201001],
			maxDayCountByLoginBonusId,
			'2026-06-17',
		);
		expect(receive.progresses).toEqual(completedProgress);
		expect(receive.receivedNowLoginBonusIds).toEqual(new Set());

		const state = {
			isLoginBonusReceived: true,
			loginBonusProgresses: completedProgress,
		};
		refreshDailyLoginBonusState(
			state,
			[{ loginBonusId: 201001, isEnabled: true }],
			'2026-06-17',
			maxDayCountByLoginBonusId,
		);
		expect(state.isLoginBonusReceived).toBe(true);
		expect(state.loginBonusProgresses).toEqual(completedProgress);
	});

	test('validates persisted login bonus entries', () => {
		expect(
			isLoginBonusActivationState({ loginBonusId: 201001, isEnabled: true }),
		).toBe(true);
		expect(isLoginBonusActivationState({ loginBonusId: 201001 })).toBe(false);
		expect(
			isLoginBonusProgressState({
				loginBonusId: 201001,
				receivedCount: 1,
				isReceivedToday: false,
				receivedGameDate: null,
			}),
		).toBe(true);
		expect(
			isLoginBonusProgressState({
				loginBonusId: 201001,
				receivedCount: 1,
				isReceivedToday: false,
			}),
		).toBe(false);
	});
});
