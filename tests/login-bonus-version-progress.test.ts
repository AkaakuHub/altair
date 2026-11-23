import { describe, expect, test } from 'bun:test';
import { createLoginBonusIdentityFingerprint } from '../src/master-data/login-bonus-identity.ts';
import { findLoginBonusProgress } from '../src/state/login-bonus-progress-state.ts';
import { receiveLoginBonuses } from '../src/state/login-bonus-receive-flow.ts';

const identity = (rewardId: number, amount = 1) =>
	createLoginBonusIdentityFingerprint({
		loginBonusId: 10,
		loginBonusKind: 'normal',
		days: [
			{ dayCount: 1, rewards: [{ rewardType: 1, rewardId }] },
			{
				dayCount: 2,
				rewards: [{ rewardType: 1, rewardId: rewardId + amount }],
			},
		],
	});

describe('login bonus version progress', () => {
	test('identity ignores reward amount while retaining day and reward structure', () => {
		expect(identity(100, 1)).not.toEqual(identity(100, 2));
		expect(
			createLoginBonusIdentityFingerprint({
				loginBonusId: 10,
				loginBonusKind: 'normal',
				days: [
					{
						dayCount: 1,
						rewards: [{ rewardType: 1, rewardId: 100, amount: 1 }],
					},
				],
			}),
		).toEqual(
			createLoginBonusIdentityFingerprint({
				loginBonusId: 10,
				loginBonusKind: 'normal',
				days: [
					{
						dayCount: 1,
						rewards: [{ rewardType: 1, rewardId: 100, amount: 999 }],
					},
				],
			}),
		);
	});

	test('preserves independent progress while preventing same-day duplicate', () => {
		const oldIdentity = identity(100);
		const newIdentity = identity(200);
		const maxDays = new Map([[10, 2]]);
		const oldFirst = receiveLoginBonuses(
			[],
			[10],
			maxDays,
			'2026-01-01',
			new Map([[10, oldIdentity]]),
			'old',
		);
		const oldDuplicate = receiveLoginBonuses(
			oldFirst.progresses,
			[10],
			maxDays,
			'2026-01-01',
			new Map([[10, oldIdentity]]),
			'old',
		);
		expect(oldDuplicate.receivedNowLoginBonusIds.size).toBe(0);
		const newFirst = receiveLoginBonuses(
			oldDuplicate.progresses,
			[10],
			maxDays,
			'2026-01-01',
			new Map([[10, newIdentity]]),
			'new',
		);
		expect(newFirst.progresses).toHaveLength(2);
		expect(
			findLoginBonusProgress(newFirst.progresses, 10, oldIdentity),
		).toMatchObject({ receivedCount: 1, sourceMasterReleaseId: 'old' });
		expect(
			findLoginBonusProgress(newFirst.progresses, 10, newIdentity),
		).toMatchObject({ receivedCount: 1, sourceMasterReleaseId: 'new' });
	});
});
