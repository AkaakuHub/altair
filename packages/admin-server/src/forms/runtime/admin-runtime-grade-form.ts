import type { Database } from 'bun:sqlite';
import {
	type AdminForm,
	getFormInteger,
	getOptionalFormString,
} from '@altair/admin-server/forms/shared/admin-form-values.ts';
import { getGradeChallengeMasterRuntimeDefaultsFromDatabase } from '../../../../../src/master-data/grade-challenge-runtime-defaults.ts';
import { getGradeLiveMasterRuntimeDefaultsFromDatabase } from '../../../../../src/master-data/grade-live-runtime-defaults.ts';
import {
	ensureGradeChallengeRuntimeState,
	ensureGradeLiveRuntimeState,
} from '../../../../../src/server-state.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';

export function updateGradeRuntimeState(
	form: AdminForm,
	state: ServerState,
	database: Database,
): void {
	updateGradeChallengeRuntimeState(form, state, database);
	updateGradeLiveRuntimeState(form, state, database);
}

function updateGradeLiveRuntimeState(
	form: AdminForm,
	state: ServerState,
	database: Database,
): void {
	const gradeLive = ensureGradeLiveRuntimeState(state);
	const previousSeasonId = gradeLive.activeGradeQuestSeasonId;
	const activeGradeQuestSeasonId = getFormInteger(
		form,
		'gradeLive.activeGradeQuestSeasonId',
		gradeLive.activeGradeQuestSeasonId,
	);
	gradeLive.activeGradeQuestSeasonId = activeGradeQuestSeasonId;
	if (activeGradeQuestSeasonId !== previousSeasonId) {
		const defaults = getGradeLiveMasterRuntimeDefaultsFromDatabase(
			database,
			activeGradeQuestSeasonId,
		);
		if (defaults !== undefined) {
			gradeLive.startDate = defaults.startDate;
			gradeLive.endDate = defaults.endDate;
			gradeLive.status = defaults.status;
		}
	}
	gradeLive.status = clampQuestTopStatus(
		getFormInteger(form, 'gradeLive.status', gradeLive.status),
	);
	const startDate = getOptionalFormString(form, 'gradeLive.startDate');
	if (startDate !== undefined && startDate.length > 0) {
		gradeLive.startDate = startDate;
	}
	const endDate = getOptionalFormString(form, 'gradeLive.endDate');
	if (endDate !== undefined && endDate.length > 0) {
		gradeLive.endDate = endDate;
	}
}

function updateGradeChallengeRuntimeState(
	form: AdminForm,
	state: ServerState,
	database: Database,
): void {
	const gradeChallenge = ensureGradeChallengeRuntimeState(state);
	const previousSeasonId = gradeChallenge.activeGradeChallengeSeasonId;
	const activeGradeChallengeSeasonId = getFormInteger(
		form,
		'gradeChallenge.activeGradeChallengeSeasonId',
		gradeChallenge.activeGradeChallengeSeasonId,
	);
	gradeChallenge.activeGradeChallengeSeasonId = activeGradeChallengeSeasonId;
	if (activeGradeChallengeSeasonId !== previousSeasonId) {
		const defaults = getGradeChallengeMasterRuntimeDefaultsFromDatabase(
			database,
			activeGradeChallengeSeasonId,
		);
		if (defaults !== undefined) {
			gradeChallenge.startDate = defaults.startDate;
			gradeChallenge.endDate = defaults.endDate;
			gradeChallenge.status = defaults.status;
		}
	}
	gradeChallenge.status = clampQuestTopStatus(
		getFormInteger(form, 'gradeChallenge.status', gradeChallenge.status),
	);
	const startDate = getOptionalFormString(form, 'gradeChallenge.startDate');
	if (startDate !== undefined && startDate.length > 0) {
		gradeChallenge.startDate = startDate;
	}
	const endDate = getOptionalFormString(form, 'gradeChallenge.endDate');
	if (endDate !== undefined && endDate.length > 0) {
		gradeChallenge.endDate = endDate;
	}
}

function clampQuestTopStatus(status: number): number {
	return status > 0 ? 1 : 0;
}
