import type { Database } from 'bun:sqlite';
import type { AdminForm } from '@altair/admin-server/forms/shared/admin-form-values.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { updateChapterRuntimeState } from './admin-runtime-chapter-form.ts';
import { updateGradeRuntimeState } from './admin-runtime-grade-form.ts';
import { updateGrandPrixRuntimeState } from './admin-runtime-grand-prix-form.ts';
import { updateLauncherInfo } from './admin-runtime-launcher-form.ts';
import { updateLoginBonusRuntimeState } from './admin-runtime-login-bonus-form.ts';

export function updateRuntimeState(
	form: AdminForm,
	state: ServerState,
	database: Database,
): void {
	updateLoginBonusRuntimeState(form, state);
	updateChapterRuntimeState(form, state, database);
	updateGrandPrixRuntimeState(form, state, database);
	updateGradeRuntimeState(form, state, database);
	updateLauncherInfo(form, state.launcherInfo);
}
