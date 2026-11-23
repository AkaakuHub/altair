import { updateChapterMissionProgressFromForm } from '../forms/quest/admin-chapter-mission-progress-form.ts';
import { updateDailyQuestTicketFromForm } from '../forms/quest/admin-daily-quest-ticket-form.ts';
import { updateDreamLiveProgressFromForm } from '../forms/quest/admin-dream-live-progress-form.ts';
import { updateGradeQuestProgressFromForm } from '../forms/quest/admin-grade-quest-progress-form.ts';
import { updateGrandPrixStageProgressFromForm } from '../forms/quest/admin-grand-prix-stage-progress-form.ts';
import { updateLearningMusicMasteryFromForm } from '../forms/quest/admin-learning-music-mastery-form.ts';
import { updateQuestStageProgressFromForm } from '../forms/quest/admin-quest-stage-progress-form.ts';
import { registerAdminFormRoute } from '../route-support/admin-route-helpers.ts';
import {
	type AdminInventoryRouteContext,
	applyWithUserMaster,
	applyWithUserMasterSelection,
} from './admin-inventory-route-context.ts';

export function registerAdminLiveProgressRoutes(
	context: AdminInventoryRouteContext,
): void {
	const { app, config, state } = context;
	registerAdminFormRoute(
		app,
		'/quest-progress',
		config,
		state,
		'invalid quest progress update',
		(form) =>
			applyWithUserMaster(context, form, (database) =>
				updateQuestStageProgressFromForm(form, state, database),
			),
	);
	registerAdminFormRoute(
		app,
		'/learning-mastery',
		config,
		state,
		'invalid learning mastery update',
		(form) =>
			applyWithUserMaster(context, form, (database) =>
				updateLearningMusicMasteryFromForm(form, state, database),
			),
	);
	registerAdminFormRoute(
		app,
		'/dream-live-progress',
		config,
		state,
		'invalid dream live progress update',
		(form) => updateDreamLiveProgressFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/grade-quest-progress',
		config,
		state,
		'invalid grade quest progress update',
		(form) => updateGradeQuestProgressFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/grand-prix-stage-progress',
		config,
		state,
		'invalid grand prix stage progress update',
		(form) => updateGrandPrixStageProgressFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/daily-quest-ticket',
		config,
		state,
		'invalid daily quest ticket update',
		(form) => updateDailyQuestTicketFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/chapter-mission-progress',
		config,
		state,
		'invalid chapter mission progress update',
		(form) =>
			applyWithUserMasterSelection(context, form, (selection) =>
				updateChapterMissionProgressFromForm(
					form,
					state,
					selection.database,
					selection.masterReleaseId,
				),
			),
	);
}
