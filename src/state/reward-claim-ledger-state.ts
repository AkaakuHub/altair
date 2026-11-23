import { isRecord } from './json-state-utils.ts';

const rewardClaimKinds = [
	'common-mission',
	'chapter-point',
	'beginner-mission',
	'beginner-mission-banner',
] as const;

type RewardClaimKind = (typeof rewardClaimKinds)[number];

export type RewardClaimRecord = {
	playerId: string;
	claimKind: RewardClaimKind;
	stableClaimId: string;
	periodKey: string;
	sourceMasterReleaseId: string;
	definitionMasterReleaseId: string;
	grantedAt: string;
};

type RewardClaimKey = Pick<
	RewardClaimRecord,
	'playerId' | 'claimKind' | 'stableClaimId' | 'periodKey'
>;

export function isRewardClaimRecord(
	value: unknown,
): value is RewardClaimRecord {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		rewardClaimKinds.some((claimKind) => claimKind === value.claimKind) &&
		typeof value.stableClaimId === 'string' &&
		typeof value.periodKey === 'string' &&
		typeof value.sourceMasterReleaseId === 'string' &&
		typeof value.definitionMasterReleaseId === 'string' &&
		typeof value.grantedAt === 'string'
	);
}

export function hasRewardClaim(
	claims: readonly RewardClaimRecord[],
	key: RewardClaimKey,
): boolean {
	return claims.some(
		(claim) =>
			claim.playerId === key.playerId &&
			claim.claimKind === key.claimKind &&
			claim.stableClaimId === key.stableClaimId &&
			(claim.periodKey === key.periodKey ||
				(key.periodKey.startsWith('definition:') &&
					claim.periodKey === 'lifetime')),
	);
}
