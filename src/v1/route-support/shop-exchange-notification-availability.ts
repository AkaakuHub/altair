import type { Database } from 'bun:sqlite';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import {
	hasAvailableGpPrizeExchangeFromDatabase,
	hasAvailableSelectTicketExchangeFromDatabase,
} from './card-exchange-notification-availability.ts';
import { hasAvailableItemExchangeFromDatabase } from './item-exchange-notification-availability.ts';
import { hasAvailableLimitBreakMaterialConvertFromDatabase } from './limit-break-convert-notification-availability.ts';
import { hasAvailablePetalExchangeFromDatabase } from './petal-exchange-notification-availability.ts';
import { hasAvailableSiscaStorePurchaseFromDatabase } from './sisca-store-notification-availability.ts';
import { hasAvailableStickerExchangeFromDatabase } from './sticker-exchange-notification-availability.ts';

export function hasAvailableShopExchangeFromDatabase(
	database: Database,
	state: ServerState,
	user: RegisteredUserState | undefined,
): boolean {
	return [
		hasAvailablePetalExchangeFromDatabase(database, state, user),
		hasAvailableSiscaStorePurchaseFromDatabase(database, state, user),
		hasAvailableGpPrizeExchangeFromDatabase(database, state, user),
		hasAvailableItemExchangeFromDatabase(database, state, user) ||
			hasAvailableLimitBreakMaterialConvertFromDatabase(database, state, user),
		hasAvailableStickerExchangeFromDatabase(database, state, user),
		hasAvailableSelectTicketExchangeFromDatabase(database, state, user),
	].some(Boolean);
}
