import { findLoginBonusProgress } from '../state/login-bonus-progress-state.ts';
import { createLoginBonusIdentityFingerprint } from './login-bonus-identity.ts';
import type {
	LoginBonusAdminRewardSummaryMaster,
	LoginBonusMaster,
	LoginBonusMasterSet,
	LoginBonusProgressView,
	LoginBonusReceivedReward,
	LoginBonusRewardRow,
	LoginBonusRow,
} from './login-bonus-master-types.ts';

export function createLoginBonusMasterSet(
	rows: readonly LoginBonusRow[],
	rewardsBySeriesId: ReadonlyMap<number, LoginBonusRewardRow[]>,
): LoginBonusMasterSet {
	const maxDayCountByLoginBonusId = new Map<number, number>();
	const loginBonuses: LoginBonusMaster[] = [];
	const eventLoginBonuses: LoginBonusMaster[] = [];
	const rewardNamePrefixBySeriesId =
		createRewardNamePrefixBySeriesId(rewardsBySeriesId);
	for (const row of rows) {
		const rewardNamePrefix = rewardNamePrefixBySeriesId.get(
			row.login_bonus_reward_series_id,
		);
		const datas =
			rewardsBySeriesId
				.get(row.login_bonus_reward_series_id)
				?.map((reward) => ({
					count: reward.day_count,
					fileName: String(reward.reward_id),
					rewards: [
						{
							amount: reward.reward_num,
							name: normalizeLoginBonusRewardName(
								reward.reward_name,
								rewardNamePrefix,
							),
							rewardId: reward.reward_id,
							rewardType: reward.reward_type,
						},
					],
				})) ?? [];
		maxDayCountByLoginBonusId.set(row.id, datas.length);
		const master = {
			loginBonusId: row.id,
			name: row.name,
			startTime: row.start_time,
			endTime: row.end_time,
			showOrder: row.row_index,
			datas,
			identityFingerprint: createLoginBonusIdentityFingerprint({
				loginBonusId: row.id,
				loginBonusKind: row.login_bonus_kind,
				days: datas.map((data) => ({
					dayCount: data.count,
					rewards: data.rewards,
				})),
			}),
		};
		if (row.login_bonus_kind === 'event') {
			eventLoginBonuses.push(master);
		} else {
			loginBonuses.push(master);
		}
	}
	return {
		loginBonuses,
		eventLoginBonuses,
		maxDayCountByLoginBonusId,
		identityFingerprintsByLoginBonusId: new Map(
			[...loginBonuses, ...eventLoginBonuses].map((bonus) => [
				bonus.loginBonusId,
				bonus.identityFingerprint,
			]),
		),
	};
}

export function getReceivedLoginBonusRewards(
	masterSet: LoginBonusMasterSet,
	progresses: readonly LoginBonusProgressView[],
	receivedNowLoginBonusIds: ReadonlySet<number>,
): LoginBonusReceivedReward[] {
	return [...masterSet.eventLoginBonuses, ...masterSet.loginBonuses].flatMap(
		(loginBonus) => {
			if (!receivedNowLoginBonusIds.has(loginBonus.loginBonusId)) {
				return [];
			}
			const receivedCount =
				findLoginBonusProgress(
					progresses,
					loginBonus.loginBonusId,
					loginBonus.identityFingerprint,
				)?.receivedCount ?? 0;
			const data = loginBonus.datas.find(
				(loginBonusData) => loginBonusData.count === receivedCount,
			);
			return (
				data?.rewards.map((reward) => ({
					loginBonusId: loginBonus.loginBonusId,
					dayCount: data.count,
					...reward,
				})) ?? []
			);
		},
	);
}

export function flattenLoginBonusRewardSummary(
	loginBonus: LoginBonusMaster,
): LoginBonusAdminRewardSummaryMaster[] {
	return loginBonus.datas.flatMap((data) =>
		data.rewards.map((reward) => ({
			dayCount: data.count,
			rewardType: reward.rewardType,
			rewardId: reward.rewardId,
			amount: reward.amount,
			name: reward.name,
		})),
	);
}

function createRewardNamePrefixBySeriesId(
	rewardsBySeriesId: ReadonlyMap<number, LoginBonusRewardRow[]>,
): ReadonlyMap<number, string> {
	const prefixBySeriesId = new Map<number, string>();
	for (const [seriesId, rewards] of rewardsBySeriesId) {
		const firstDayReward = rewards.find((reward) => reward.day_count === 1);
		if (firstDayReward === undefined) {
			continue;
		}
		const marker = '1日目のプレゼントです';
		const markerIndex = firstDayReward.reward_name.indexOf(marker);
		if (markerIndex >= 0) {
			prefixBySeriesId.set(
				seriesId,
				firstDayReward.reward_name.slice(0, markerIndex),
			);
		}
	}
	return prefixBySeriesId;
}

function normalizeLoginBonusRewardName(
	rewardName: string,
	rewardNamePrefix: string | undefined,
): string {
	if (rewardNamePrefix === undefined || !rewardName.startsWith('0 ')) {
		return rewardName;
	}
	return `${rewardNamePrefix}${rewardName.slice(2)}`;
}
