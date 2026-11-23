import type { Database } from 'bun:sqlite';
import {
	projectUserCards,
	projectUserInventory,
} from '../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import type { ServerState } from '../../server-state-schema.ts';
import { findUserCards } from '../../state/user-card-aggregate-state.ts';
import { findUserInventory } from '../../state/user-inventory-aggregate.ts';

export function projectUserOwnedState(
	database: Database,
	state: Pick<ServerState, 'userCards' | 'userInventories'>,
	playerId: string,
): {
	cards: ReturnType<typeof findUserCards>;
	inventory: ReturnType<typeof findUserInventory>;
} {
	const support = createUserOwnedMasterSupport(database);
	const cards = findUserCards(state, playerId);
	const inventory = findUserInventory(state, playerId);
	return {
		cards: cards === undefined ? undefined : projectUserCards(cards, support),
		inventory:
			inventory === undefined
				? undefined
				: projectUserInventory(inventory, support),
	};
}
