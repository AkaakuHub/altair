import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import {
	findLoginBonusProgress,
	upsertLoginBonusProgress,
} from './login-bonus-progress-state.ts';
import type { LoginBonusProgressState } from './login-bonus-types.ts';

type LoginBonusReceiveResult = {
	progresses: LoginBonusProgressState[];
	receivedNowLoginBonusIds: Set<number>;
};

export function receiveLoginBonuses(
	currentProgresses: LoginBonusProgressState[],
	loginBonusIds: readonly number[],
	maxDayCountByLoginBonusId: ReadonlyMap<number, number>,
	gameDate: string,
	identityFingerprints?: ReadonlyMap<number, EntityIdentityFingerprint>,
	sourceMasterReleaseId?: string,
): LoginBonusReceiveResult {
	let progresses = [...currentProgresses];
	const receivedNowLoginBonusIds = new Set<number>();
	for (const loginBonusId of loginBonusIds) {
		const maxDayCount = maxDayCountByLoginBonusId.get(loginBonusId);
		if (maxDayCount === undefined) {
			throw new Error(`login bonus max day count not found: ${loginBonusId}`);
		}
		if (maxDayCount <= 0) {
			continue;
		}
		const identityFingerprint = identityFingerprints?.get(loginBonusId);
		const current = findLoginBonusProgress(
			progresses,
			loginBonusId,
			identityFingerprint,
		) ?? {
			loginBonusId,
			receivedCount: 0,
			isReceivedToday: false,
			receivedGameDate: null,
		};
		if (current.isReceivedToday && current.receivedGameDate === gameDate) {
			continue;
		}
		if (current.receivedCount >= maxDayCount) {
			continue;
		}
		progresses = upsertLoginBonusProgress(progresses, {
			loginBonusId,
			...(sourceMasterReleaseId === undefined ? {} : { sourceMasterReleaseId }),
			...(identityFingerprint === undefined ? {} : { identityFingerprint }),
			receivedCount: Math.min(current.receivedCount + 1, maxDayCount),
			isReceivedToday: true,
			receivedGameDate: gameDate,
		});
		receivedNowLoginBonusIds.add(loginBonusId);
	}
	return {
		progresses: progresses.sort(
			(left, right) => left.loginBonusId - right.loginBonusId,
		),
		receivedNowLoginBonusIds,
	};
}
