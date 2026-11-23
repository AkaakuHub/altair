import type { ServerState } from '../../../../../src/server-state-schema.ts';
import {
	ensureUserDailyQuestState,
	setDailyQuestTicketInfo,
} from '../../../../../src/state/daily-quest-state.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateDailyQuestTicketFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const num = getAdminBoundedInteger(form, 'num', 0, 999);
	const max = getAdminBoundedInteger(form, 'max', 0, 999);
	if (playerId.length === 0 || num === undefined || max === undefined)
		return false;
	return setDailyQuestTicketInfo(
		ensureUserDailyQuestState(state, playerId).value,
		num,
		max,
	);
}
