import {
	hasRewardClaim,
	type RewardClaimRecord,
} from '../state/reward-claim-ledger-state.ts';

type RewardClaimState = {
	rewardClaims: RewardClaimRecord[];
};

export function runRewardClaimMutation<T extends RewardClaimState, Result>(
	state: T,
	mutate: () => Result,
): Result {
	const stateBeforeMutation = structuredClone(state);
	try {
		return mutate();
	} catch (error) {
		restoreServerState(state, stateBeforeMutation);
		throw error;
	}
}

export function applyRewardClaim<T extends RewardClaimState>(
	state: T,
	claim: RewardClaimRecord,
	grant: () => void,
): boolean {
	return applyRewardClaims(state, [claim], grant).length === 1;
}

export function applyRewardClaims<T extends RewardClaimState>(
	state: T,
	claims: readonly RewardClaimRecord[],
	grant: (acceptedClaims: readonly RewardClaimRecord[]) => void,
): RewardClaimRecord[] {
	const stateBeforeClaim = structuredClone(state);
	const acceptedClaims = appendRewardClaims(state, claims);
	if (acceptedClaims.length === 0) {
		return [];
	}
	try {
		grant(acceptedClaims);
	} catch (error) {
		restoreServerState(state, stateBeforeClaim);
		throw error;
	}
	return acceptedClaims;
}

export function appendRewardClaims<T extends RewardClaimState>(
	state: T,
	claims: readonly RewardClaimRecord[],
): RewardClaimRecord[] {
	const acceptedClaims: RewardClaimRecord[] = [];
	for (const claim of claims) {
		if (
			hasRewardClaim(state.rewardClaims, claim) ||
			hasRewardClaim(acceptedClaims, claim)
		) {
			continue;
		}
		acceptedClaims.push(claim);
	}
	state.rewardClaims.push(...acceptedClaims);
	return acceptedClaims;
}

function restoreServerState<T extends RewardClaimState>(
	state: T,
	previous: T,
): void {
	Object.assign(state, previous);
}
