import {
	type AdminForm,
	getFormInteger,
} from '@altair/admin-server/forms/shared/admin-form-values.ts';
import type { LauncherInfo } from '../../../../../src/server-state-schema.ts';
import { editableLauncherInfoKeys } from '../../../../../src/state/launcher-info-keys.ts';

export function updateLauncherInfo(
	form: AdminForm,
	launcherInfo: LauncherInfo,
): void {
	for (const key of editableLauncherInfoKeys) {
		const value = getFormInteger(
			form,
			`launcher.${key}`,
			launcherInfo[key] ?? 1,
		);
		launcherInfo[key] = Math.min(3, Math.max(0, value));
	}
}
