import type { Database } from 'bun:sqlite';
import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import {
	getEnabledLoginBonusMastersFromDatabase,
	getLoginBonusIdentityFingerprintsFromDatabase,
} from '../../../../../src/master-data/login-bonus-master.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import {
	getEnabledLoginBonusIds,
	setLoginBonusActivation,
} from '../../../../../src/state/login-bonus-activation-state.ts';
import {
	areEnabledLoginBonusesReceivedToday,
	findLoginBonusProgress,
	setLoginBonusProgress,
} from '../../../../../src/state/login-bonus-progress-state.ts';
import {
	ensureUserSession,
	type UserSessionState,
} from '../../../../../src/state/user-session-state.ts';
import { parseAdminActivationEntries } from '../shared/admin-activation-form-parser.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormBoolean,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateLoginBonusProgressFromForm(
	form: AdminForm,
	state: ServerState,
	gameDate: string,
	database: Database,
	sourceMasterReleaseId?: string,
): boolean {
	const loginBonusId = getAdminPositiveId(form, 'loginBonusId');
	const receivedCount = getAdminBoundedInteger(
		form,
		'receivedCount',
		0,
		MAX_ADMIN_ITEM_QUANTITY,
	);
	if (loginBonusId === undefined || receivedCount === undefined) return false;
	const session = getSelectedAdminUserSession(state);
	if (session === undefined) return false;
	const isReceivedToday = getFormBoolean(form, 'isReceivedToday');
	const loginBonusMasters = getEnabledLoginBonusMastersFromDatabase(
		database,
		getEnabledLoginBonusIds(state.loginBonusActivations),
	);
	const identityFingerprint =
		getLoginBonusIdentityFingerprintsFromDatabase(database).get(loginBonusId);
	if (identityFingerprint === undefined || sourceMasterReleaseId === undefined)
		return false;
	const normalizedReceivedCount = loginBonusReceivedCountFromForm(
		session.loginBonusProgresses,
		loginBonusId,
		receivedCount,
		isReceivedToday,
		identityFingerprint,
	);
	session.loginBonusProgresses = setLoginBonusProgress(
		session.loginBonusProgresses,
		loginBonusId,
		normalizedReceivedCount,
		isReceivedToday,
		gameDate,
		{ sourceMasterReleaseId, identityFingerprint },
	);
	session.isLoginBonusReceived = areEnabledLoginBonusesReceivedToday(
		session.loginBonusProgresses,
		state.loginBonusActivations,
		gameDate,
		loginBonusMasters.maxDayCountByLoginBonusId,
		loginBonusMasters.identityFingerprintsByLoginBonusId,
	);
	return true;
}

export function updateLoginBonusActivationsFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const activations = parseAdminActivationEntries(
		getFormString(form, 'activations'),
		'loginBonusId',
	);
	if (activations === undefined) return false;
	for (const { id, isEnabled } of activations) {
		state.loginBonusActivations = setLoginBonusActivation(
			state.loginBonusActivations,
			id,
			isEnabled,
		);
	}
	return true;
}

function loginBonusReceivedCountFromForm(
	progresses: UserSessionState['loginBonusProgresses'],
	loginBonusId: number,
	receivedCount: number,
	isReceivedToday: boolean,
	identityFingerprint: Parameters<typeof findLoginBonusProgress>[2],
): number {
	const current = findLoginBonusProgress(
		progresses,
		loginBonusId,
		identityFingerprint,
	);
	if (
		isReceivedToday ||
		current === undefined ||
		!current.isReceivedToday ||
		current.receivedCount !== receivedCount
	) {
		return receivedCount;
	}
	return Math.max(0, receivedCount - 1);
}

export function getSelectedAdminUserSession(
	state: ServerState,
): UserSessionState | undefined {
	const playerId = state.selectedAdminPlayerId;
	return playerId === null
		? undefined
		: ensureUserSession(state, playerId).value;
}
