import { getItemIdentityFingerprints } from '../../../../src/master-data/entity-identity-fingerprints.ts';
import { getItemCatalogFromDatabase } from '../../../../src/master-data/item-master.ts';
import { createProvenanceByDefinitionId } from '../domain/admin-entity-provenance.ts';
import {
	addUserItemFromForm,
	maxAllUserItemsFromForm,
	updateUserItemState,
} from '../forms/inventory/admin-item-form.ts';
import { registerAdminFormRoute } from '../route-support/admin-route-helpers.ts';
import {
	type AdminInventoryRouteContext,
	applyWithUserMasterSelection,
} from './admin-inventory-route-context.ts';

export function registerAdminItemRoutes(
	context: AdminInventoryRouteContext,
): void {
	const { app, config, state } = context;
	registerAdminFormRoute(
		app,
		'/user-item',
		config,
		state,
		'invalid user item update',
		(form) => updateUserItemState(form, state),
	);
	registerAdminFormRoute(
		app,
		'/user-item/add',
		config,
		state,
		'invalid user item add',
		(form) =>
			applyWithUserMasterSelection(context, form, (selection) =>
				addUserItemFromForm(
					form,
					state,
					getItemCatalogFromDatabase(selection.database),
					createProvenanceByDefinitionId(
						selection.masterReleaseId,
						getItemIdentityFingerprints(selection.database),
					),
				),
			),
	);
	registerAdminFormRoute(
		app,
		'/user-item/max-all',
		config,
		state,
		'invalid user item max all',
		(form) =>
			applyWithUserMasterSelection(
				context,
				form,
				(selection, userStatus) =>
					maxAllUserItemsFromForm(
						form,
						state,
						getItemCatalogFromDatabase(selection.database),
						userStatus,
						createProvenanceByDefinitionId(
							selection.masterReleaseId,
							getItemIdentityFingerprints(selection.database),
						),
					) !== undefined,
			),
	);
}
