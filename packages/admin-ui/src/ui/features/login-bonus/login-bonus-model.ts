import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import { parseBoundedFormInteger } from '@altair/runtime/admin/domain/forms/integer.ts';
import type { LoginBonusSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type {
	AdminLoginBonusActivation,
	AdminLoginBonusProgress,
	AdminUserSession,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { findSelectedPlayerState } from '../player-state.ts';

export type LoginBonusProgressForm = {
	loginBonusId: number;
	receivedCount: string;
	isReceivedToday: boolean;
};
export type LoginBonusActivationForm = Record<number, boolean>;

export function createLoginBonusProgressForm(
	data: AdminStateResponse,
	loginBonusId: number,
): LoginBonusProgressForm {
	const progress = findLoginBonusProgress(
		findSelectedAdminUserSession(data)?.loginBonusProgresses ?? [],
		loginBonusId,
	);
	return {
		loginBonusId,
		receivedCount: String(progress?.receivedCount ?? 0),
		isReceivedToday: progress?.isReceivedToday ?? false,
	};
}

export function findSelectedAdminUserSession(
	data: AdminStateResponse,
): AdminUserSession | undefined {
	return findSelectedPlayerState(data, data.state.userSessions);
}

export function loginBonusReceivedTodayForm(
	form: LoginBonusProgressForm,
	isReceivedToday: boolean,
): LoginBonusProgressForm {
	const receivedCount = parseLoginBonusReceivedCount(form.receivedCount);
	if (!isReceivedToday && form.isReceivedToday && receivedCount !== null)
		return {
			...form,
			receivedCount: String(Math.max(0, receivedCount - 1)),
			isReceivedToday,
		};
	return { ...form, isReceivedToday };
}

export function parseLoginBonusReceivedCount(value: string): number | null {
	if (value.trim().length === 0) return null;
	return (
		parseBoundedFormInteger(
			String(Number(value)),
			0,
			MAX_ADMIN_ITEM_QUANTITY,
		) ?? null
	);
}

export function findLoginBonusProgress(
	progresses: AdminLoginBonusProgress[],
	loginBonusId: number,
): AdminLoginBonusProgress | undefined {
	return progresses.find((progress) => progress.loginBonusId === loginBonusId);
}

export function getActiveLoginBonuses(
	loginBonuses: LoginBonusSummary[],
	activations: AdminLoginBonusActivation[],
): LoginBonusSummary[] {
	const activeIds = new Set(
		activations
			.filter((activation) => activation.isEnabled)
			.map((activation) => activation.loginBonusId),
	);
	return loginBonuses.filter((loginBonus) =>
		activeIds.has(loginBonus.loginBonusId),
	);
}

export function filterLoginBonuses(
	loginBonuses: LoginBonusSummary[],
	activationForm: LoginBonusActivationForm,
	query: string,
	activeOnly: boolean,
): LoginBonusSummary[] {
	return filterLoginBonusesByQuery(
		loginBonuses.filter(
			(loginBonus) =>
				!activeOnly || (activationForm[loginBonus.loginBonusId] ?? false),
		),
		query,
	);
}

export function filterLoginBonusesByQuery(
	loginBonuses: LoginBonusSummary[],
	query: string,
): LoginBonusSummary[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) return loginBonuses;
	return loginBonuses.filter((bonus) =>
		`${bonus.loginBonusId} ${bonus.loginBonusKind} ${bonus.name} ${bonus.startTime} ${bonus.endTime}`
			.toLowerCase()
			.includes(normalized),
	);
}

export function createLoginBonusActivationForm(
	activations: AdminLoginBonusActivation[],
): LoginBonusActivationForm {
	return Object.fromEntries(
		activations.map((activation) => [
			activation.loginBonusId,
			activation.isEnabled,
		]),
	);
}

export function getChangedLoginBonusActivations(
	loginBonuses: LoginBonusSummary[],
	activations: AdminLoginBonusActivation[],
	form: LoginBonusActivationForm,
): { loginBonusId: number; isEnabled: boolean }[] {
	const enabledById = new Map(
		activations.map((activation) => [
			activation.loginBonusId,
			activation.isEnabled,
		]),
	);
	return loginBonuses
		.filter(
			(bonus) =>
				(form[bonus.loginBonusId] ?? false) !==
				(enabledById.get(bonus.loginBonusId) ?? false),
		)
		.map((bonus) => ({
			loginBonusId: bonus.loginBonusId,
			isEnabled: form[bonus.loginBonusId] ?? false,
		}));
}
