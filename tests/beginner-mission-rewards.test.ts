import { describe, expect, test } from 'bun:test';
import { createBeginnerMissionClaim } from '../src/v1/route-support/beginner-mission-rewards.ts';

describe('beginner mission reward claim', () => {
	test('definition identityとmaster releaseをclaim ledgerへ保持する', () => {
		expect(
			createBeginnerMissionClaim(
				'player-a',
				900101,
				'release-a',
				'2026-07-11T00:00:00.000Z',
				{ domain: 'beginner-mission', value: 'mission-definition-a' },
			),
		).toEqual({
			playerId: 'player-a',
			claimKind: 'beginner-mission',
			stableClaimId: '900101',
			periodKey: 'definition:mission-definition-a',
			sourceMasterReleaseId: 'release-a',
			definitionMasterReleaseId: 'release-a',
			grantedAt: '2026-07-11T00:00:00.000Z',
		});
	});

	test('identityがない既存missionはlifetime claimとして扱う', () => {
		expect(
			createBeginnerMissionClaim(
				'player-a',
				900101,
				'release-a',
				'2026-07-11T00:00:00.000Z',
			).periodKey,
		).toBe('lifetime');
	});
});
