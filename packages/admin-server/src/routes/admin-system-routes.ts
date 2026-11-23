import type { Database } from 'bun:sqlite';
import {
	parseAdminForm,
	persistAdminState,
	redirectAdmin,
	registerAdminFormRoute,
} from '@altair/admin-server/route-support/admin-route-helpers.ts';
import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { ActiveMasterSelection } from '../../../../src/master-data/active-master-repository.ts';
import type { ResourceVersionRegistry } from '../../../../src/resource-versions.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import { updateMaintenanceModeFromForm } from '../forms/runtime/admin-maintenance-mode-form.ts';
import { updateResourceVersionOverridesFromForm } from '../forms/runtime/admin-resource-version-form.ts';
import { updateRuntimeState } from '../forms/runtime/admin-runtime-form.ts';

export function registerAdminSystemRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
	resourceVersions: ResourceVersionRegistry,
	activeMaster: ActiveMasterSelection,
	resolveCurrentMasterDatabase: () => Database,
): void {
	app.post('/state', async (c) => {
		const form = await parseAdminForm(c);
		updateRuntimeState(form, state, resolveCurrentMasterDatabase());
		persistAdminState(config, state);
		return redirectAdmin(c);
	});

	registerAdminFormRoute(
		app,
		'/resource-version',
		config,
		state,
		'invalid resource version update',
		(form) =>
			updateResourceVersionOverridesFromForm(
				form,
				state,
				resourceVersions,
				activeMaster,
			),
	);

	registerAdminFormRoute(
		app,
		'/maintenance-mode',
		config,
		state,
		'invalid maintenance mode update',
		(form) => updateMaintenanceModeFromForm(form, state),
	);
}
