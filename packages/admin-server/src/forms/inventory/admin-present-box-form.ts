import { createPresentRewardProvenance } from '../../../../../src/application/present-reward-provenance.ts';
import type { ActiveMasterRouteSelection as MasterDatabaseSelection } from '../../../../../src/master-data/active-master-repository.ts';
import { getItemCatalogFromDatabase } from '../../../../../src/master-data/item-master.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import {
	addPresentBoxItem,
	deletePresentBoxItem,
	ensureUserPresentBox,
} from '../../../../../src/state/user-presents-state.ts';
import { findAdminEntryByKey } from '../../state/domain/admin-state-writer.ts';
import {
	type AdminForm,
	getAdminItemQuantity,
	getFormInteger,
	getFormString,
} from '../shared/admin-form-values.ts';

export function addPresentBoxItemFromForm(
	form: AdminForm,
	state: ServerState,
	selection: MasterDatabaseSelection,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const itemId = getFormInteger(form, 'itemId', Number.NaN);
	const num = getAdminItemQuantity(form, 'num', 1);
	const comment =
		getFormString(form, 'comment') || 'Adminから追加したプレゼントです。';
	const item = getItemCatalogFromDatabase(selection.database).find(
		(entry) => entry.itemId === itemId,
	);
	if (playerId.length === 0 || !item || num === undefined) {
		return false;
	}
	const presentBox = ensureUserPresentBox(state, playerId).value;
	addPresentBoxItem(
		presentBox,
		{
			itemId: item.itemId,
			itemType: item.itemType,
			name: item.name,
		},
		num,
		comment,
		null,
		'',
		createPresentRewardProvenance(
			selection.database,
			selection.masterReleaseId,
			item.itemId,
			item.itemType,
		),
	);
	return true;
}

export function deletePresentBoxItemFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const presentBoxId = getFormString(form, 'presentBoxId');
	if (playerId.length === 0 || presentBoxId.length === 0) {
		return false;
	}
	const presentBox = findAdminEntryByKey(
		state.userPresentBoxes,
		playerId,
		(userPresentBox) => userPresentBox.playerId,
	);
	if (!presentBox || !deletePresentBoxItem(presentBox, presentBoxId)) {
		return false;
	}
	return true;
}
