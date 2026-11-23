import type { ServerState } from '../../../../../src/server-state-schema.ts';
import {
	removeReportApplication,
	setReportApplication,
} from '../../../../../src/state/user-social-aggregate.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getFormString,
} from '../shared/admin-form-values.ts';

export function setReportApplicationFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return setReportApplication(
		state,
		getFormString(form, 'playerId'),
		getFormString(form, 'targetPlayerId'),
		getAdminBoundedInteger(form, 'reportType', 1, 999),
	);
}

export function removeReportApplicationFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return removeReportApplication(
		state,
		getFormString(form, 'playerId'),
		getFormString(form, 'targetPlayerId'),
	);
}
