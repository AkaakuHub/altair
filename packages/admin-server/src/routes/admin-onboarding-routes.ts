import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { ActiveMasterRouteSelection as MasterDatabaseSelection } from '../../../../src/master-data/active-master-repository.ts';
import { createRuntimeDateService } from '../../../../src/runtime-date.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import { supportedTutorialIds } from '../../../../src/state/user-tutorial-state.ts';
import {
	updateLoginBonusActivationsFromForm,
	updateLoginBonusProgressFromForm,
} from '../forms/onboarding/admin-login-bonus-form.ts';
import {
	updateBeginnerMissionFromForm,
	updateMissionProgressFromForm,
	updateStepUpBeginnerMissionFromForm,
} from '../forms/user/admin-user-mission-form.ts';
import {
	updateSimpleTutorialFromForm,
	updateUserTutorialFromForm,
} from '../forms/user/admin-user-tutorial-form.ts';
import {
	applyWithAdminFormPlayerDependency,
	registerAdminFormRoute,
} from '../route-support/admin-route-helpers.ts';

export function registerAdminOnboardingRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
	resolveUserMasterSelection: (playerId: string) => MasterDatabaseSelection,
): void {
	const date = createRuntimeDateService(config);
	registerAdminFormRoute(
		app,
		'/tutorial',
		config,
		state,
		'invalid tutorial update',
		(form) => updateUserTutorialFromForm(form, state, supportedTutorialIds),
	);
	registerAdminFormRoute(
		app,
		'/simple-tutorial',
		config,
		state,
		'invalid simple tutorial update',
		(form) => updateSimpleTutorialFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/login-bonus',
		config,
		state,
		'invalid login bonus update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) =>
					updateLoginBonusProgressFromForm(
						form,
						state,
						date.currentGameDate(),
						selection.database,
						selection.masterReleaseId,
					),
			),
	);
	registerAdminFormRoute(
		app,
		'/login-bonus-activations',
		config,
		state,
		'invalid login bonus activation update',
		(form) => updateLoginBonusActivationsFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/mission',
		config,
		state,
		'invalid mission update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) =>
					updateMissionProgressFromForm(
						form,
						state,
						selection.database,
						selection.masterReleaseId,
					),
			),
	);
	registerAdminFormRoute(
		app,
		'/beginner-mission',
		config,
		state,
		'invalid beginner mission update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) =>
					updateBeginnerMissionFromForm(
						form,
						state,
						selection.database,
						selection.masterReleaseId,
					),
			),
	);
	registerAdminFormRoute(
		app,
		'/step-up-beginner-mission',
		config,
		state,
		'invalid step-up beginner mission update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) =>
					updateStepUpBeginnerMissionFromForm(form, state, selection.database),
			),
	);
}
