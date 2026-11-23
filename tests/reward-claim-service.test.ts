import { describe, expect, test } from 'bun:test';
import {
	applyRewardClaim,
	runRewardClaimMutation,
} from '../src/application/reward-claim-service.ts';
import type { RewardClaimRecord } from '../src/state/reward-claim-ledger-state.ts';

describe('reward claim service', () => {
	test('prevents the same stable claim across definition master releases', () => {
		const state: { rewardClaims: RewardClaimRecord[]; grantedAmount: number } =
			{
				rewardClaims: [],
				grantedAmount: 0,
			};
		const claim = createClaim('release-a');

		expect(
			applyRewardClaim(state, claim, () => {
				state.grantedAmount += 10;
			}),
		).toBe(true);
		expect(
			applyRewardClaim(state, createClaim('release-b'), () => {
				state.grantedAmount += 99;
			}),
		).toBe(false);

		expect(state.grantedAmount).toBe(10);
		expect(state.rewardClaims).toEqual([claim]);
	});

	test('rolls back the ledger and reward state when grant fails', () => {
		const state: { rewardClaims: RewardClaimRecord[]; grantedAmount: number } =
			{
				rewardClaims: [],
				grantedAmount: 0,
			};

		expect(() =>
			applyRewardClaim(state, createClaim('release-a'), () => {
				state.grantedAmount += 1;
				throw new Error('grant failed');
			}),
		).toThrow('grant failed');

		expect(state.grantedAmount).toBe(0);
		expect(state.rewardClaims).toEqual([]);
	});

	test('後続reward失敗時に先行するstamina・result・mission更新を戻す', () => {
		const state = {
			rewardClaims: [] as RewardClaimRecord[],
			stamina: 100,
			questResult: null as null | { score: number },
			missionProgress: 0,
			items: [{ itemId: 1, amount: 0 }],
		};

		expect(() =>
			runRewardClaimMutation(state, () => {
				state.stamina -= 10;
				state.questResult = { score: 1_000 };
				state.missionProgress += 1;
				state.items[0]!.amount += 1;
				throw new Error('second reward identity mismatch');
			}),
		).toThrow('second reward identity mismatch');

		expect(state).toEqual({
			rewardClaims: [],
			stamina: 100,
			questResult: null,
			missionProgress: 0,
			items: [{ itemId: 1, amount: 0 }],
		});
	});
});

function createClaim(masterReleaseId: string): RewardClaimRecord {
	return {
		playerId: '10000000000001',
		claimKind: 'common-mission',
		stableClaimId: '1001',
		periodKey: 'lifetime',
		sourceMasterReleaseId: masterReleaseId,
		definitionMasterReleaseId: masterReleaseId,
		grantedAt: '2026-07-11T00:00:00.000Z',
	};
}
