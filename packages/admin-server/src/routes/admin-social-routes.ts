import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import {
	removeReportApplicationFromForm,
	setReportApplicationFromForm,
} from '../forms/social/admin-social-form.ts';
import { registerAdminFormRoute } from '../route-support/admin-route-helpers.ts';

export function registerAdminSocialRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
): void {
	registerAdminFormRoute(
		app,
		'/social/report',
		config,
		state,
		'invalid social report update',
		(form) => setReportApplicationFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/social/report/delete',
		config,
		state,
		'invalid social report delete',
		(form) => removeReportApplicationFromForm(form, state),
	);
}
