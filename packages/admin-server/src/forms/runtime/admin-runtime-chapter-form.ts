import type { Database } from 'bun:sqlite';
import {
	type AdminForm,
	getFormInteger,
	getOptionalFormString,
} from '@altair/admin-server/forms/shared/admin-form-values.ts';
import { getChapterRuntimeDefaultsFromDatabase } from '../../../../../src/master-data/chapter-admin-master-data.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';

export function updateChapterRuntimeState(
	form: AdminForm,
	state: ServerState,
	database: Database,
): void {
	const previousChapterId = state.chapter.activeChapterId;
	const activeChapterId = getFormInteger(
		form,
		'chapter.activeChapterId',
		state.chapter.activeChapterId,
	);
	const defaults = getChapterRuntimeDefaultsFromDatabase(
		database,
		activeChapterId,
	);
	if (defaults !== undefined) {
		state.chapter.activeChapterId = activeChapterId;
		if (activeChapterId !== previousChapterId) {
			state.chapter.startDate = defaults.startDate;
			state.chapter.endDate = defaults.endDate;
		}
	}
	const startDate = getOptionalFormString(form, 'chapter.startDate');
	if (startDate !== undefined && startDate.length > 0) {
		state.chapter.startDate = startDate;
	}
	const endDate = getOptionalFormString(form, 'chapter.endDate');
	if (endDate !== undefined && endDate.length > 0) {
		state.chapter.endDate = endDate;
	}
}
