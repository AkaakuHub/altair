import type { Database } from 'bun:sqlite';
import {
	createLoginBonusMasterSet,
	flattenLoginBonusRewardSummary,
} from './login-bonus-master-mapping.ts';
import {
	readLoginBonusRewards,
	readLoginBonusRows,
} from './login-bonus-master-query.ts';
import type {
	LoginBonusAdminSummaryMaster,
	LoginBonusMasterSet,
} from './login-bonus-master-types.ts';
import { currentUtcIsoDateTime } from './master-time.ts';

export { getReceivedLoginBonusRewards } from './login-bonus-master-mapping.ts';
export type {
	LoginBonusAdminRewardSummaryMaster,
	LoginBonusAdminSummaryMaster,
	LoginBonusMaster,
	LoginBonusMasterSet,
	LoginBonusProgressView,
	LoginBonusReceivedReward,
} from './login-bonus-master-types.ts';

export function getEnabledLoginBonusMastersFromDatabase(
	database: Database,
	enabledLoginBonusIds: ReadonlySet<number>,
): LoginBonusMasterSet {
	const rows = readLoginBonusRows(database).filter((row) =>
		enabledLoginBonusIds.has(row.id),
	);
	return createMasterSet(database, rows);
}

export function getCurrentlyActiveLoginBonusIdsFromDatabase(
	database: Database,
): number[] {
	const now = currentUtcIsoDateTime();
	return readLoginBonusRows(database).flatMap((row) =>
		Date.parse(row.start_time) <= Date.parse(now) &&
		Date.parse(row.end_time) > Date.parse(now)
			? [row.id]
			: [],
	);
}

export function getLoginBonusAdminSummaryFromDatabase(
	database: Database,
): LoginBonusAdminSummaryMaster[] {
	const masterSet = createMasterSet(database, readLoginBonusRows(database));
	return [
		...masterSet.eventLoginBonuses.map((loginBonus) => ({
			loginBonusId: loginBonus.loginBonusId,
			loginBonusKind: 'event' as const,
			name: loginBonus.name,
			dayCount: loginBonus.datas.length,
			startTime: loginBonus.startTime,
			endTime: loginBonus.endTime,
			rewards: flattenLoginBonusRewardSummary(loginBonus),
		})),
		...masterSet.loginBonuses.map((loginBonus) => ({
			loginBonusId: loginBonus.loginBonusId,
			loginBonusKind: 'normal' as const,
			name: loginBonus.name,
			dayCount: loginBonus.datas.length,
			startTime: loginBonus.startTime,
			endTime: loginBonus.endTime,
			rewards: flattenLoginBonusRewardSummary(loginBonus),
		})),
	].sort((left, right) => left.loginBonusId - right.loginBonusId);
}

export function getLoginBonusIdentityFingerprintsFromDatabase(
	database: Database,
) {
	return createMasterSet(database, readLoginBonusRows(database))
		.identityFingerprintsByLoginBonusId;
}

function createMasterSet(
	database: Database,
	rows: Parameters<typeof createLoginBonusMasterSet>[0],
): LoginBonusMasterSet {
	const rewardSeriesIds = [
		...new Set(rows.map((row) => row.login_bonus_reward_series_id)),
	];
	return createLoginBonusMasterSet(
		rows,
		readLoginBonusRewards(database, rewardSeriesIds),
	);
}
