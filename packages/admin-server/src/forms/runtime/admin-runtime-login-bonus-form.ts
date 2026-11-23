import { getSelectedAdminUserSession } from '@altair/admin-server/forms/onboarding/admin-login-bonus-form.ts';
import {
	type AdminForm,
	getOptionalFormString,
} from '@altair/admin-server/forms/shared/admin-form-values.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';

export function updateLoginBonusRuntimeState(
	form: AdminForm,
	state: ServerState,
): void {
	const loginBonusReceived = getOptionalFormString(
		form,
		'isLoginBonusReceived',
	);
	if (loginBonusReceived === undefined) {
		return;
	}
	const session = getSelectedAdminUserSession(state);
	if (session !== undefined) {
		session.isLoginBonusReceived = loginBonusReceived === 'true';
	}
}
