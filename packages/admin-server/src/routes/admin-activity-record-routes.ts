import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { ActiveMasterRouteSelection as MasterDatabaseSelection } from '../../../../src/master-data/active-master-repository.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import {
	updateActivityRecordAdvFromForm,
	updateActivityRecordMonthFromForm,
} from '../forms/user/admin-user-activity-record-form.ts';
import {
	applyWithAdminFormPlayerDependency,
	registerAdminFormRoute,
} from '../route-support/admin-route-helpers.ts';

export function registerAdminActivityRecordRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
	resolveUserMasterSelection: (playerId: string) => MasterDatabaseSelection,
): void {
	registerAdminFormRoute(
		app,
		'/activity-record/adv',
		config,
		state,
		'invalid activity record adv update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) => updateActivityRecordAdvFromForm(form, state, selection),
			),
	);
	registerAdminFormRoute(
		app,
		'/activity-record/month',
		config,
		state,
		'invalid activity record month update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) =>
					updateActivityRecordMonthFromForm(form, state, selection),
			),
	);
}
