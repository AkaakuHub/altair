import { getMemberFanLevelTableFromDatabase } from '../../../../src/master-data/member-fan-level-master.ts';
import {
	addAllUserStickersFromForm,
	addUserStickerFromForm,
	allocateArchivePrizeStarsFromForm,
	removeUserStickerFromForm,
	updateArchiveGiftPointFromForm,
} from '../forms/inventory/admin-archive-form.ts';
import {
	applyWithAdminFormPlayerDependency,
	registerAdminFormRoute,
} from '../route-support/admin-route-helpers.ts';
import {
	type AdminInventoryRouteContext,
	applyWithUserMaster,
	applyWithUserMasterSelection,
} from './admin-inventory-route-context.ts';

export function registerAdminStickerRoutes(
	context: AdminInventoryRouteContext,
): void {
	const { app, config, state } = context;
	registerAdminFormRoute(
		app,
		'/user-sticker/add',
		config,
		state,
		'invalid user sticker add',
		(form) =>
			applyWithUserMasterSelection(context, form, (selection) =>
				addUserStickerFromForm(form, state, selection),
			),
	);
	registerAdminFormRoute(
		app,
		'/user-sticker/add-all',
		config,
		state,
		'invalid user sticker add all',
		(form) =>
			applyWithUserMasterSelection(context, form, (selection) =>
				addAllUserStickersFromForm(form, state, selection),
			),
	);
	registerAdminFormRoute(
		app,
		'/user-sticker/remove',
		config,
		state,
		'invalid user sticker remove',
		(form) =>
			applyWithUserMasterSelection(context, form, (selection) =>
				removeUserStickerFromForm(form, state, selection),
			),
	);
}

export function registerAdminArchiveRoutes(
	context: AdminInventoryRouteContext,
): void {
	const { app, config, resolveUserMasterSelection, state } = context;
	registerAdminFormRoute(
		app,
		'/archive-gift-point',
		config,
		state,
		'invalid archive gift point update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterSelection,
				(selection) => updateArchiveGiftPointFromForm(form, state, selection),
			),
	);
	registerAdminFormRoute(
		app,
		'/archive-prize-stars',
		config,
		state,
		'invalid archive prize star allocation',
		(form) =>
			applyWithUserMaster(context, form, (database, userStatus) =>
				allocateArchivePrizeStarsFromForm(
					form,
					state,
					userStatus,
					getMemberFanLevelTableFromDatabase(database),
					database,
				),
			),
	);
}
