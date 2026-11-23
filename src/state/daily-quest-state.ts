import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import { isRecord } from './json-state-utils.ts';

export type UserDailyQuestState = {
	playerId: string;
	userDailyTicketInfo: {
		num: number;
		max: number;
	};
	recoveryCount: number;
	recoveryGameDate: string | null;
	temporaryReleaseDailyQuestSeriesIdList: number[];
};

export type DailyQuestRecoveryResult = {
	challengeCount: number;
};

export function ensureUserDailyQuestState(
	state: Pick<ServerState, 'userDailyQuestStates'>,
	playerId: string,
): EnsureStateResult<UserDailyQuestState> {
	const existing = state.userDailyQuestStates.find(
		(dailyQuest) => dailyQuest.playerId === playerId,
	);
	if (existing) {
		return { value: existing, created: false };
	}
	const dailyQuest = createUserDailyQuestState(playerId);
	state.userDailyQuestStates = [...state.userDailyQuestStates, dailyQuest];
	return { value: dailyQuest, created: true };
}

function createUserDailyQuestState(playerId: string): UserDailyQuestState {
	return {
		playerId,
		userDailyTicketInfo: {
			num: 3,
			max: 3,
		},
		recoveryCount: 0,
		recoveryGameDate: null,
		temporaryReleaseDailyQuestSeriesIdList: [],
	};
}

export function consumeDailyQuestTicket(
	dailyQuest: UserDailyQuestState,
): boolean {
	const current = dailyQuest.userDailyTicketInfo;
	if (current.num < 1) {
		return false;
	}
	dailyQuest.userDailyTicketInfo = {
		...current,
		num: current.num - 1,
	};
	return true;
}

export function setDailyQuestTicketInfo(
	dailyQuest: UserDailyQuestState,
	num: number,
	max: number,
): boolean {
	if (
		!Number.isSafeInteger(num) ||
		num < 0 ||
		!Number.isSafeInteger(max) ||
		max < 0 ||
		num > max
	) {
		return false;
	}
	dailyQuest.userDailyTicketInfo = { num, max };
	return true;
}

export function recoverDailyQuestChallengeCount(
	dailyQuest: UserDailyQuestState,
	status: { jewelFree: number },
	recoveryCount: number | undefined,
	gameDate: string,
): DailyQuestRecoveryResult | undefined {
	if (
		recoveryCount === undefined ||
		!Number.isSafeInteger(recoveryCount) ||
		recoveryCount < 1
	) {
		return undefined;
	}
	const currentRecoveryCount = readDailyQuestRecoveryCount(
		dailyQuest,
		gameDate,
	);
	if (currentRecoveryCount + recoveryCount > 3) {
		return undefined;
	}
	const price = 40 * recoveryCount;
	if (status.jewelFree < price) {
		return undefined;
	}
	const current = dailyQuest.userDailyTicketInfo;
	status.jewelFree -= price;
	dailyQuest.recoveryGameDate = gameDate;
	dailyQuest.recoveryCount = currentRecoveryCount + recoveryCount;
	dailyQuest.userDailyTicketInfo = {
		...current,
		num: current.num + recoveryCount,
	};
	return {
		challengeCount: dailyQuest.userDailyTicketInfo.num,
	};
}

export function readDailyQuestRecoveryCount(
	dailyQuest: UserDailyQuestState,
	gameDate: string,
): number {
	return dailyQuest.recoveryGameDate === gameDate
		? dailyQuest.recoveryCount
		: 0;
}

export function isUserDailyQuestState(
	value: unknown,
): value is UserDailyQuestState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		isDailyQuestTicketInfo(value.userDailyTicketInfo) &&
		typeof value.recoveryCount === 'number' &&
		(value.recoveryGameDate === null ||
			typeof value.recoveryGameDate === 'string') &&
		Array.isArray(value.temporaryReleaseDailyQuestSeriesIdList) &&
		value.temporaryReleaseDailyQuestSeriesIdList.every(
			(seriesId) => typeof seriesId === 'number',
		)
	);
}

function isDailyQuestTicketInfo(value: unknown): value is {
	num: number;
	max: number;
} {
	return (
		isRecord(value) &&
		typeof value.num === 'number' &&
		typeof value.max === 'number'
	);
}
