import type { Database } from 'bun:sqlite';
import { getExchangeCardRows } from './gacha-master-queries.ts';

type GachaExchangeCardMaster = {
	cardDatasId: number;
	cardName: string;
	cardRarity: string;
};

export function getGachaExchangeCardsBySelectTicketSeriesIdsFromDatabase(
	database: Database,
	selectTicketSeriesIds: readonly number[],
): GachaExchangeCardMaster[] {
	const uniqueSeriesIds = [...new Set(selectTicketSeriesIds)].filter((id) =>
		Number.isSafeInteger(id),
	);
	if (uniqueSeriesIds.length === 0) return [];
	return getExchangeCardRows(database, uniqueSeriesIds).map((row) => ({
		cardDatasId: row.card_datas_id,
		cardName: row.card_name,
		cardRarity: row.card_rarity,
	}));
}
