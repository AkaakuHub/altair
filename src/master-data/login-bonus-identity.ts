import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';

export function createLoginBonusIdentityFingerprint(source: {
	loginBonusId: number;
	loginBonusKind: 'normal' | 'event';
	days: readonly {
		dayCount: number;
		rewards: readonly {
			rewardType: number;
			rewardId: number;
			amount?: number;
			name?: string;
		}[];
	}[];
}): EntityIdentityFingerprint {
	return {
		domain: 'login-bonus',
		value: JSON.stringify([
			source.loginBonusId,
			source.loginBonusKind,
			source.days.map((day) => [
				day.dayCount,
				day.rewards.map((reward) => [reward.rewardType, reward.rewardId]),
			]),
		]),
	};
}
