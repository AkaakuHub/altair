import { describe, expect, test } from 'bun:test';
import { createCommonMissionRewardIdentityFingerprint } from '../src/master-data/mission-identity.ts';
import { markBeginnerMissionProgressReceived } from '../src/state/beginner-mission-progress-state.ts';
import type { BeginnerMissionProgressState } from '../src/state/beginner-mission-types.ts';
import {
	getReceivedCommonMissionOrder,
	recordReceivedCommonMissionRewards,
} from '../src/state/mission-common-receipt.ts';
import type { UserMissionState } from '../src/state/mission-types.ts';
import { hasRewardClaim } from '../src/state/reward-claim-ledger-state.ts';

const reward = (orderId: number) => ({
	commonMissionId: 10,
	clearConditionNum: 100,
	orderId,
	identityFingerprint: createCommonMissionRewardIdentityFingerprint({
		commonMissionId: 10,
		orderId,
	}),
	reward: { itemType: 1, itemId: 2, amount: 3 },
});

describe('mission reward version', () => {
	test('does not promote a versioned beginner receipt to a legacy global id', () => {
		const mission = {
			playerId: 'player',
			missionProgresses: [],
			receivedMissionIds: [],
			receivedMissionTypes: [],
		};
		const progress: BeginnerMissionProgressState = {
			missionId: 10,
			sourceMasterReleaseId: 'release',
			identityFingerprint: { domain: 'beginner-mission', value: 'identity' },
			achievedNum: 1,
			status: 1,
		};
		markBeginnerMissionProgressReceived(mission, progress);
		expect(progress.status).toBe(2);
		expect(mission.receivedMissionIds).toEqual([]);
	});

	test('projects received order only from compatible reward identities', () => {
		const mission: UserMissionState = {
			playerId: 'player',
			commonMissionInfo: {
				receivedOrder: 0,
				rhythmGameStar: 0,
				schoolStageStar: 0,
			},
			missionProgresses: [],
			dailyMissionGameDate: null,
		};
		recordReceivedCommonMissionRewards(mission, [reward(2)], 'old');
		expect(getReceivedCommonMissionOrder(mission, [reward(2)])).toBe(2);
		expect(getReceivedCommonMissionOrder(mission, [reward(5)])).toBe(0);
		recordReceivedCommonMissionRewards(mission, [reward(5)], 'new');
		expect(getReceivedCommonMissionOrder(mission, [reward(2)])).toBe(2);
		expect(getReceivedCommonMissionOrder(mission, [reward(5)])).toBe(5);
	});

	test('treats legacy order and claim as received for every identity', () => {
		const mission: UserMissionState = {
			playerId: 'player',
			commonMissionInfo: {
				receivedOrder: 4,
				rhythmGameStar: 0,
				schoolStageStar: 0,
			},
			missionProgresses: [],
			dailyMissionGameDate: null,
		};
		expect(getReceivedCommonMissionOrder(mission, [reward(2)])).toBe(4);
		expect(
			hasRewardClaim(
				[
					{
						playerId: 'player',
						claimKind: 'beginner-mission',
						stableClaimId: '10',
						periodKey: 'lifetime',
						sourceMasterReleaseId: 'legacy',
						definitionMasterReleaseId: 'legacy',
						grantedAt: '2026-01-01T00:00:00Z',
					},
				],
				{
					playerId: 'player',
					claimKind: 'beginner-mission',
					stableClaimId: '10',
					periodKey: 'definition:new',
				},
			),
		).toBe(true);
	});

	test('allows a different exact definition claim while blocking the same one', () => {
		const claims = [
			{
				playerId: 'player',
				claimKind: 'beginner-mission' as const,
				stableClaimId: '10',
				periodKey: 'definition:old',
				sourceMasterReleaseId: 'old',
				definitionMasterReleaseId: 'old',
				grantedAt: '2026-01-01T00:00:00Z',
			},
		];
		expect(
			hasRewardClaim(claims, {
				playerId: 'player',
				claimKind: 'beginner-mission',
				stableClaimId: '10',
				periodKey: 'definition:old',
			}),
		).toBe(true);
		expect(
			hasRewardClaim(claims, {
				playerId: 'player',
				claimKind: 'beginner-mission',
				stableClaimId: '10',
				periodKey: 'definition:new',
			}),
		).toBe(false);
	});
});
