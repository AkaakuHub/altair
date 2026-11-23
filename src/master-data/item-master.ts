import type { Database } from 'bun:sqlite';
import type { ItemCatalogEntry } from '../state/item-definition.ts';

type ItemEffectEntry = {
	itemId: number;
	effectValue: number;
};

export function getItemCatalogFromDatabase(
	database: Database,
): ItemCatalogEntry[] {
	const rows = database
		.query(
			[
				'SELECT id, item_type, item_category, rarity, name, limit_num, requestable_num',
				'FROM master_items',
				'ORDER BY id',
			].join(' '),
		)
		.all() as Array<{
		id: number;
		item_type: number;
		item_category: number;
		rarity: number;
		name: string;
		limit_num: number;
		requestable_num: number;
	}>;
	return rows.map(createItemCatalogEntry);
}

export function getItemCategoryCountFromDatabase(database: Database): number {
	const row = database
		.query('SELECT COUNT(DISTINCT item_category) AS count FROM master_items')
		.get() as { count: number } | null;
	return row?.count ?? 0;
}

export function getItemDefinitionByItemIdFromDatabase(
	database: Database,
	itemId: number,
): ItemCatalogEntry | undefined {
	const row = database
		.query(
			[
				'SELECT id, item_type, item_category, rarity, name, limit_num, requestable_num',
				'FROM master_items',
				'WHERE id = ?',
			].join(' '),
		)
		.get(itemId) as {
		id: number;
		item_type: number;
		item_category: number;
		rarity: number;
		name: string;
		limit_num: number;
		requestable_num: number;
	} | null;
	if (!row) {
		return undefined;
	}
	return createItemCatalogEntry(row);
}

export function getItemEffectFromDatabase(
	database: Database,
	itemId: number,
): ItemEffectEntry | undefined {
	const row = database
		.query('SELECT id, effect_value FROM master_items WHERE id = ?')
		.get(itemId) as { id: number; effect_value: number } | null;
	if (!row) {
		return undefined;
	}
	return {
		itemId: row.id,
		effectValue: row.effect_value,
	};
}

function createItemCatalogEntry(row: {
	id: number;
	item_type: number;
	item_category: number;
	rarity: number;
	name: string;
	limit_num: number;
	requestable_num: number;
}): ItemCatalogEntry {
	return {
		itemId: row.id,
		itemType: row.item_type,
		itemCategory: row.item_category,
		rarity: row.rarity,
		name: row.name,
		limitNum: row.limit_num,
		requestableNum: row.requestable_num,
		resourceFileName: '',
		limitDateTime: null,
	};
}
