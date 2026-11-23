import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { ActiveMasterRouteSelection as MasterDatabaseSelection } from '../../../../src/master-data/active-master-repository.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import {
	updateGachaSeriesActivationsFromForm,
	updateSelectTicketSeriesActivationsFromForm,
} from '../forms/gacha/admin-gacha-server-form.ts';
import {
	deleteGachaPurchasePlanFromForm,
	updateGachaPurchasePlanFromForm,
	updateGachaSeriesProgressFromForm,
} from '../forms/gacha/admin-user-gacha-form.ts';
import {
	applyWithAdminFormPlayerDependency,
	registerAdminFormRoute,
} from '../route-support/admin-route-helpers.ts';
import { updateGachaGuaranteeRoute } from '../route-support/gacha-guarantee-route.ts';

export function registerAdminGachaRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
	resolveUserMasterSelection: (playerId: string) => MasterDatabaseSelection,
): void {
	registerAdminFormRoute(
		app,
		'/gacha-activations',
		config,
		state,
		'invalid gacha activation update',
		(form) => updateGachaSeriesActivationsFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/gacha/select-ticket-activations',
		config,
		state,
		'invalid select ticket activation update',
		(form) => updateSelectTicketSeriesActivationsFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/gacha/series',
		config,
		state,
		'invalid gacha series update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) =>
					updateGachaSeriesProgressFromForm(
						form,
						state,
						selection.database,
						selection.masterReleaseId,
					),
			),
	);
	registerAdminFormRoute(
		app,
		'/gacha/purchase-plan',
		config,
		state,
		'invalid gacha purchase plan update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) =>
					updateGachaPurchasePlanFromForm(
						form,
						state,
						selection.database,
						selection.masterReleaseId,
					),
			),
	);
	registerAdminFormRoute(
		app,
		'/gacha/purchase-plan/delete',
		config,
		state,
		'invalid gacha purchase plan delete',
		(form) => deleteGachaPurchasePlanFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/gacha/guarantee',
		config,
		state,
		'invalid gacha guarantee update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) =>
					updateGachaGuaranteeRoute(form, state, selection.database),
			),
	);
}
