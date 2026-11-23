import type { Database } from 'bun:sqlite';
import {
	type ItemDetailRow,
	mapItemDetailResponse,
} from './item-detail-response-mapper.ts';

export function getItemDetailByItemIdFromDatabase(
	database: Database,
	itemId: number,
): ReturnType<typeof mapItemDetailResponse> | undefined {
	const row = database
		.query<ItemDetailRow, [number]>(
			[
				'SELECT id, name, description, item_type',
				'FROM master_items',
				'WHERE id = ?',
			].join(' '),
		)
		.get(itemId);
	if (!row) return undefined;
	return mapItemDetailResponse(row);
}
