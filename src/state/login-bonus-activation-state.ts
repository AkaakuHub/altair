import type { LoginBonusActivationState } from './login-bonus-types.ts';

export function setLoginBonusActivation(
	activations: LoginBonusActivationState[],
	loginBonusId: number,
	isEnabled: boolean,
): LoginBonusActivationState[] {
	if (!Number.isSafeInteger(loginBonusId) || loginBonusId <= 0) {
		return activations;
	}
	const nextActivation = { loginBonusId, isEnabled };
	const existingIndex = activations.findIndex(
		(activation) => activation.loginBonusId === loginBonusId,
	);
	if (existingIndex === -1) {
		return [...activations, nextActivation].sort(
			(left, right) => left.loginBonusId - right.loginBonusId,
		);
	}
	return activations.map((activation, index) =>
		index === existingIndex ? nextActivation : activation,
	);
}

export function getEnabledLoginBonusIds(
	activations: readonly LoginBonusActivationState[],
): Set<number> {
	return new Set(
		activations
			.filter((activation) => activation.isEnabled)
			.map((activation) => activation.loginBonusId),
	);
}
