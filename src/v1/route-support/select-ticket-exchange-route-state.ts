import type { Database } from 'bun:sqlite';
import {
	getSelectTicketExchangeTicketItemIdBySeriesIdFromDatabase,
	getSelectTicketSeriesExchangeTicketsFromDatabase,
} from '../../master-data/gacha-select-ticket-master.ts';
import type { ServerState } from '../../server-state-schema.ts';
import { getEnabledSelectTicketSeriesIds } from '../../state/select-ticket-activation-state.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import type { SelectTicketSeriesResponse } from '../response-types/gacha-response-types.ts';

type SelectTicketExchangeListItem = {
	selectTicketSeriesId: number;
	userSelectTicketNum: number;
};

export function getSelectTicketExchangeListFromInventory(
	database: Database,
	inventory: UserInventoryState,
): SelectTicketExchangeListItem[] {
	return getSelectTicketSeriesExchangeTicketsFromDatabase(database)
		.map((series) => ({
			selectTicketSeriesId: series.selectTicketSeriesId,
			userSelectTicketNum:
				findUserItemByItemId(inventory, series.exchangeTicketId)?.itemNum ?? 0,
		}))
		.filter((item) => item.userSelectTicketNum > 0);
}

export function getActiveSelectTicketSeriesList(
	database: Database,
	inventory: UserInventoryState,
	state: Pick<ServerState, 'selectTicketSeriesActivations'>,
): SelectTicketSeriesResponse[] {
	const enabledSeriesIds = getEnabledSelectTicketSeriesIds(
		state.selectTicketSeriesActivations,
	);
	return getSelectTicketSeriesExchangeTicketsFromDatabase(database)
		.filter((series) => enabledSeriesIds.has(series.selectTicketSeriesId))
		.map((series) => ({
			select_ticket_series_id: series.selectTicketSeriesId,
			user_exchange_ticket_num:
				findUserItemByItemId(inventory, series.exchangeTicketId)?.itemNum ?? 0,
			is_sale_select_ticket: true,
		}));
}

export function hasSelectTicketExchangeItem(
	database: Database,
	inventory: UserInventoryState,
	selectTicketSeriesId: number,
): boolean {
	const exchangeTicketId =
		getSelectTicketExchangeTicketItemIdBySeriesIdFromDatabase(
			database,
			selectTicketSeriesId,
		);
	return (
		exchangeTicketId !== undefined &&
		(findUserItemByItemId(inventory, exchangeTicketId)?.itemNum ?? 0) > 0
	);
}
