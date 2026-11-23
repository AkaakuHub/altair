import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { ensureUserHeaderState } from '../../../../../src/state/user-header-state.ts';
import type { OfficialDataMigrationDump } from './official-data-migration-dump.ts';
import type { OfficialDataMigrationApplyResultCollector } from './official-data-migration-feature-types.ts';
import { upsertOfficialDataMigrationAccountLink } from './projectors/official-data-migration-account-link.ts';
import {
	createCardsFromResponse,
	createDecksFromResponse,
} from './projectors/official-data-migration-apply-cards-decks.ts';
import { upsertRegisteredUser } from './projectors/official-data-migration-apply-identity.ts';
import { createInventoryFromResponse } from './projectors/official-data-migration-apply-inventory.ts';
import {
	createProfileDesignFromResponses,
	createProfileSettingsFromResponses,
} from './projectors/official-data-migration-apply-profile.ts';
import { applyUserStatusFromDump } from './projectors/official-data-migration-apply-status.ts';
import { upsertMigrationPlayerState } from './projectors/official-data-migration-apply-upsert.ts';
import { applyUserFlagsFromDump } from './projectors/official-data-migration-apply-user-flags.ts';

export function applyOfficialDataMigrationAccountFeatures(
	state: ServerState,
	dump: OfficialDataMigrationDump,
	userStatus: UserStatusController,
	playerId: string,
	accountLinkIdToken: string,
	collector: OfficialDataMigrationApplyResultCollector,
): boolean {
	upsertRegisteredUser(
		state,
		playerId,
		dump.preview.deviceSpecificId,
		dump.responsesByPath.get('/v1/profile/get_info'),
	);
	collector.addCategory('registeredUsers');
	if (accountLinkIdToken.length > 0) {
		upsertOfficialDataMigrationAccountLink(state, {
			provider: 1,
			playerId,
			idToken: accountLinkIdToken,
			platformType: 1,
		});
		collector.addCategory('accountLinks');
	}
	ensureUserHeaderState(state, playerId);
	collector.addCategory('userHeaders');
	if (applyUserStatusFromDump(state, playerId, dump, userStatus))
		collector.addCategory('userStatuses');
	collector.addCategories(applyUserFlagsFromDump(state, playerId, dump));

	const inventory = createInventoryFromResponse(
		playerId,
		dump.responsesByPath.get('/v1/user/items/get_list'),
	);
	const inventoryImported = inventory !== null;
	if (inventory === null) {
		collector.addError(
			'/v1/user/items/get_list response does not contain non-empty user_item_list',
		);
	} else {
		upsertMigrationPlayerState(state.userInventories, inventory);
		collector.addCategory('userInventories');
	}
	const cards = createCardsFromResponse(
		playerId,
		dump.responsesByPath.get('/v1/user/card/get_list'),
	);
	if (cards === null) {
		collector.addError(
			'/v1/user/card/get_list response does not contain user_card_data_list',
		);
	} else {
		upsertMigrationPlayerState(state.userCards, cards);
		collector.addCategory('userCards');
	}
	const profileSettings = createProfileSettingsFromResponses(
		playerId,
		dump.responsesByPath.get('/v1/home/get_custom_setting'),
		dump.responsesByPath.get('/v1/home/get_wallpaper_setting'),
		dump.responsesByPath.get('/v1/home/get_home'),
	);
	if (profileSettings !== null) {
		upsertMigrationPlayerState(state.userProfileSettings, profileSettings);
		collector.addCategory('userProfileSettings');
	}
	const profileDesign = createProfileDesignFromResponses(
		playerId,
		dump.responsesByPath.get('/v1/profile/get_my_design_card_list'),
		dump.responsesByPath.get('/v1/profile/get_my_design_icon_list'),
	);
	if (profileDesign !== null) {
		upsertMigrationPlayerState(state.userProfileDesigns, profileDesign);
		collector.addCategory('userProfileDesigns');
	}
	const decks = createDecksFromResponse(
		playerId,
		dump.responsesByPath.get('/v1/user/deck/get_list'),
	);
	if (decks !== null) {
		upsertMigrationPlayerState(state.userDecks, decks);
		collector.addCategory('userDecks');
	}
	return inventoryImported;
}
