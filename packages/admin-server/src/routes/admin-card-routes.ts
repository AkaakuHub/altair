import { getCardIdentityFingerprints } from '../../../../src/master-data/entity-identity-fingerprints.ts';
import { getAdminCardCatalog } from '../catalog/application/admin-catalog.ts';
import { MasterDataAdminCardCatalogReader } from '../catalog/infrastructure/master-data-admin-card-catalog-reader.ts';
import { createProvenanceByDefinitionId } from '../domain/admin-entity-provenance.ts';
import {
	addAllUserCardsFromForm,
	addUserCardFromForm,
	maxAllUserCardsFromForm,
	removeUserCardFromForm,
	updateUserCardFromForm,
} from '../forms/inventory/admin-card-form.ts';
import { registerAdminFormRoute } from '../route-support/admin-route-helpers.ts';
import {
	type AdminInventoryRouteContext,
	applyWithUserMasterSelection,
} from './admin-inventory-route-context.ts';

export function registerAdminCardRoutes(
	context: AdminInventoryRouteContext,
): void {
	const { app, config, state } = context;
	registerAdminFormRoute(
		app,
		'/user-card',
		config,
		state,
		'invalid user card update',
		(form) => updateUserCardFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/user-card/add',
		config,
		state,
		'invalid user card add',
		(form) =>
			applyWithUserMasterSelection(context, form, (selection) =>
				addUserCardFromForm(
					form,
					state,
					getAdminCardCatalog(
						new MasterDataAdminCardCatalogReader(selection.database),
					),
					createProvenanceByDefinitionId(
						selection.masterReleaseId,
						getCardIdentityFingerprints(selection.database),
					),
				),
			),
	);
	registerAdminFormRoute(
		app,
		'/user-card/add-all',
		config,
		state,
		'invalid user card add all',
		(form) =>
			applyWithUserMasterSelection(
				context,
				form,
				(selection, userStatus) =>
					addAllUserCardsFromForm(
						form,
						state,
						getAdminCardCatalog(
							new MasterDataAdminCardCatalogReader(selection.database),
						),
						userStatus,
						createProvenanceByDefinitionId(
							selection.masterReleaseId,
							getCardIdentityFingerprints(selection.database),
						),
					) !== undefined,
			),
	);
	registerAdminFormRoute(
		app,
		'/user-card/remove',
		config,
		state,
		'invalid user card remove',
		(form) => removeUserCardFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/user-card/max-all',
		config,
		state,
		'invalid user card max all',
		(form) =>
			applyWithUserMasterSelection(
				context,
				form,
				(selection, userStatus) =>
					maxAllUserCardsFromForm(
						form,
						state,
						getAdminCardCatalog(
							new MasterDataAdminCardCatalogReader(selection.database),
						),
						userStatus,
						createProvenanceByDefinitionId(
							selection.masterReleaseId,
							getCardIdentityFingerprints(selection.database),
						),
					) !== undefined,
			),
	);
}
