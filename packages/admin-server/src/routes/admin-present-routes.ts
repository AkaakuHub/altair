import {
	addPresentBoxItemFromForm,
	deletePresentBoxItemFromForm,
} from '../forms/inventory/admin-present-box-form.ts';
import {
	applyWithAdminFormPlayerDependency,
	registerAdminFormRoute,
} from '../route-support/admin-route-helpers.ts';
import type { AdminInventoryRouteContext } from './admin-inventory-route-context.ts';

export function registerAdminPresentRoutes(
	context: AdminInventoryRouteContext,
): void {
	const { app, config, resolveUserMasterSelection, state } = context;
	registerAdminFormRoute(
		app,
		'/present',
		config,
		state,
		'invalid present add',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) => addPresentBoxItemFromForm(form, state, selection),
			),
	);
	registerAdminFormRoute(
		app,
		'/present/delete',
		config,
		state,
		'invalid present delete',
		(form) => deletePresentBoxItemFromForm(form, state),
	);
}
