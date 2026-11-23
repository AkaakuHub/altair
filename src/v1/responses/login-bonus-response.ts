import type {
	LoginBonusMaster,
	LoginBonusMasterSet,
	LoginBonusProgressView,
} from '../../master-data/login-bonus-master.ts';
import { normalizeUtcDateTime } from '../../master-data/master-date-time.ts';
import { findLoginBonusProgress } from '../../state/login-bonus-progress-state.ts';
import type {
	LoginBonusEntryResponse,
	LoginBonusResponse,
} from '../response-types/archive-chapter-login-response-types.ts';

export function createLoginBonusResponse(
	masterSet: LoginBonusMasterSet,
	progresses: readonly LoginBonusProgressView[],
	receivedNowLoginBonusIds: ReadonlySet<number>,
): LoginBonusResponse {
	return {
		event_login_bonus_list: createLoginBonusEntries(
			masterSet.eventLoginBonuses,
			progresses,
			receivedNowLoginBonusIds,
		),
		login_bonus_list: createLoginBonusEntries(
			masterSet.loginBonuses,
			progresses,
			receivedNowLoginBonusIds,
		),
	};
}

function createLoginBonusEntries(
	loginBonuses: readonly LoginBonusMaster[],
	progresses: readonly LoginBonusProgressView[],
	receivedNowLoginBonusIds: ReadonlySet<number>,
): LoginBonusEntryResponse[] {
	return loginBonuses
		.filter((loginBonus) =>
			receivedNowLoginBonusIds.has(loginBonus.loginBonusId),
		)
		.map((loginBonus) =>
			createLoginBonusEntry(loginBonus, progresses, receivedNowLoginBonusIds),
		);
}

function createLoginBonusEntry(
	loginBonus: LoginBonusMaster,
	progresses: readonly LoginBonusProgressView[],
	receivedNowLoginBonusIds: ReadonlySet<number>,
): LoginBonusEntryResponse {
	const progress = findLoginBonusProgress(
		progresses,
		loginBonus.loginBonusId,
		loginBonus.identityFingerprint,
	);
	const receivedCount = progress?.receivedCount ?? 0;
	const isReceivedNow = receivedNowLoginBonusIds.has(loginBonus.loginBonusId);
	return {
		datas: loginBonus.datas.map((data) => ({
			count: data.count,
			file_name: data.fileName,
			is_get: data.count <= receivedCount,
			is_now_get: isReceivedNow && data.count === receivedCount,
			rewards: data.rewards.map((reward) => ({
				amount: reward.amount,
				name: reward.name,
				reward_id: reward.rewardId,
				reward_type: reward.rewardType,
			})),
		})),
		end_time: normalizeUtcDateTime(loginBonus.endTime),
		file_name: '',
		login_bonus_id: loginBonus.loginBonusId,
		name: loginBonus.name,
		show_order: loginBonus.showOrder,
		start_time: normalizeUtcDateTime(loginBonus.startTime),
	};
}
