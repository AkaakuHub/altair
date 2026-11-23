import { isRecord } from './json-state-utils.ts';
import type {
	LoginBonusActivationState,
	LoginBonusProgressState,
} from './login-bonus-types.ts';

export function isLoginBonusActivationState(
	value: unknown,
): value is LoginBonusActivationState {
	return (
		isRecord(value) &&
		typeof value.loginBonusId === 'number' &&
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string')) &&
		typeof value.isEnabled === 'boolean'
	);
}

export function isLoginBonusProgressState(
	value: unknown,
): value is LoginBonusProgressState {
	return (
		isRecord(value) &&
		typeof value.loginBonusId === 'number' &&
		typeof value.receivedCount === 'number' &&
		typeof value.isReceivedToday === 'boolean' &&
		(value.receivedGameDate === null ||
			typeof value.receivedGameDate === 'string')
	);
}
