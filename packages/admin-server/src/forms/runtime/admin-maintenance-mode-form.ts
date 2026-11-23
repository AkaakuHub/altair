import type { AdminForm } from '@altair/admin-server/forms/shared/admin-form-values.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';

export function updateMaintenanceModeFromForm(
	form: AdminForm,
	state: Pick<ServerState, 'maintenanceMode'>,
): boolean {
	const isEnabled = form.isEnabled;
	if (isEnabled !== 'true' && isEnabled !== 'false') {
		return false;
	}
	state.maintenanceMode.isEnabled = isEnabled === 'true';
	return true;
}
