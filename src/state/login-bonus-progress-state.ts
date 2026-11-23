import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';
import { getEnabledLoginBonusIds } from './login-bonus-activation-state.ts';
import type {
	LoginBonusActivationState,
	LoginBonusProgressState,
} from './login-bonus-types.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';

export function findLoginBonusProgress<
	T extends {
		loginBonusId: number;
		identityFingerprint?: EntityIdentityFingerprint;
	},
>(
	progresses: readonly T[],
	loginBonusId: number,
	identityFingerprint?: EntityIdentityFingerprint,
): T | undefined {
	if (identityFingerprint === undefined) {
		return progresses.find(
			(progress) => progress.loginBonusId === loginBonusId,
		);
	}
	return findCompatibleMasterBoundProgress(
		progresses,
		(progress) => progress.loginBonusId === loginBonusId,
		identityFingerprint,
	);
}

export function upsertLoginBonusProgress(
	progresses: LoginBonusProgressState[],
	progress: LoginBonusProgressState,
): LoginBonusProgressState[] {
	const same = (current: LoginBonusProgressState) =>
		current.loginBonusId === progress.loginBonusId &&
		(progress.identityFingerprint === undefined
			? current.identityFingerprint === undefined
			: isSameEntityIdentity(
					current.identityFingerprint,
					progress.identityFingerprint,
				));
	return [...progresses.filter((current) => !same(current)), progress];
}

export function setLoginBonusProgress(
	progresses: LoginBonusProgressState[],
	loginBonusId: number,
	receivedCount: number,
	isReceivedToday: boolean,
	gameDate: string,
	provenance?: {
		sourceMasterReleaseId: string;
		identityFingerprint: EntityIdentityFingerprint;
	},
): LoginBonusProgressState[] {
	if (
		!Number.isSafeInteger(loginBonusId) ||
		loginBonusId <= 0 ||
		!Number.isSafeInteger(receivedCount) ||
		receivedCount < 0
	) {
		return progresses;
	}
	const nextProgress = {
		loginBonusId,
		...(provenance ?? {}),
		receivedCount,
		isReceivedToday,
		receivedGameDate: isReceivedToday ? gameDate : null,
	};
	return upsertLoginBonusProgress(progresses, nextProgress).sort(
		(left, right) => left.loginBonusId - right.loginBonusId,
	);
}

export function areEnabledLoginBonusesReceivedToday(
	progresses: readonly LoginBonusProgressState[],
	activations: readonly LoginBonusActivationState[],
	gameDate: string,
	maxDayCountByLoginBonusId: ReadonlyMap<number, number>,
	identityFingerprints?: ReadonlyMap<number, EntityIdentityFingerprint>,
): boolean {
	const enabledLoginBonusIds = getEnabledLoginBonusIds(activations);
	if (enabledLoginBonusIds.size === 0) {
		return true;
	}
	return [...enabledLoginBonusIds].every((loginBonusId) => {
		const progress = findLoginBonusProgress(
			progresses,
			loginBonusId,
			identityFingerprints?.get(loginBonusId),
		);
		return (
			isCompletedLoginBonusProgress(progress, maxDayCountByLoginBonusId) ||
			(progress?.isReceivedToday === true &&
				progress.receivedGameDate === gameDate)
		);
	});
}

export function refreshDailyLoginBonusState(
	state: {
		isLoginBonusReceived: boolean;
		loginBonusProgresses: LoginBonusProgressState[];
	},
	activations: readonly LoginBonusActivationState[],
	gameDate: string,
	maxDayCountByLoginBonusId: ReadonlyMap<number, number>,
	identityFingerprints?: ReadonlyMap<number, EntityIdentityFingerprint>,
): void {
	state.loginBonusProgresses = state.loginBonusProgresses.map((progress) => {
		const target = identityFingerprints?.get(progress.loginBonusId);
		const isHidden =
			target !== undefined &&
			progress.identityFingerprint !== undefined &&
			!isSameEntityIdentity(progress.identityFingerprint, target);
		return isHidden ||
			progress.receivedGameDate === gameDate ||
			isCompletedLoginBonusProgress(progress, maxDayCountByLoginBonusId)
			? progress
			: { ...progress, isReceivedToday: false };
	});
	state.isLoginBonusReceived = areEnabledLoginBonusesReceivedToday(
		state.loginBonusProgresses,
		activations,
		gameDate,
		maxDayCountByLoginBonusId,
		identityFingerprints,
	);
}

function isCompletedLoginBonusProgress(
	progress: LoginBonusProgressState | undefined,
	maxDayCountByLoginBonusId: ReadonlyMap<number, number>,
): boolean {
	if (progress === undefined) {
		return false;
	}
	const maxDayCount = maxDayCountByLoginBonusId.get(progress.loginBonusId);
	return maxDayCount !== undefined && progress.receivedCount >= maxDayCount;
}
