import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import { parseBoundedFormInteger } from '@altair/runtime/admin/domain/forms/integer.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type { UserItem } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { ItemCatalogEntry } from '../../../../../../src/state/item-definition.ts';
import { parseSafeFormInteger } from '../../../domain/forms/number.ts';
import type { AdminMessages } from '../../../i18n/messages.ts';
import { findPlayerState } from '../player-state.ts';

type ItemForm = { itemId: string; itemNum: string };

export function createItemForm(
	itemId: string,
	items: ReadonlyArray<Pick<UserItem, 'itemId' | 'itemNum'>>,
): ItemForm {
	return {
		itemId,
		itemNum: String(
			items.find((item) => String(item.itemId) === itemId)?.itemNum ?? 1,
		),
	};
}

export function normalizeItemTargetId(value: string): string {
	const parsed = parseSafeFormInteger(value, Number.MIN_SAFE_INTEGER);
	return parsed === undefined ? value : String(parsed);
}

export function parseItemQuantity(
	value: string,
	minimum: 0 | 1,
	copy: AdminMessages['validation'],
): number {
	const parsed =
		value.trim().length === 0
			? undefined
			: parseBoundedFormInteger(
					String(Number(value)),
					minimum,
					MAX_ADMIN_ITEM_QUANTITY,
				);
	if (parsed === undefined)
		throw new Error(copy.quantity(minimum, MAX_ADMIN_ITEM_QUANTITY));
	return parsed;
}

export function getCurrentUserItems(
	data: AdminStateResponse,
	playerId: string,
): UserItem[] {
	return (
		findPlayerState(data.state.userInventories, playerId)
			?.itemCategoryList.flatMap((category) => category.userItemList)
			.filter((item) => !isSiscaItemId(item.itemId)) ?? []
	);
}

export function findItemName(
	catalog: ItemCatalogEntry[],
	itemId: number,
): string {
	return catalog.find((item) => item.itemId === itemId)?.name ?? '';
}

export function filterUserItems(
	items: UserItem[],
	query: string,
	itemCatalog: ItemCatalogEntry[],
): UserItem[] {
	return filterRows(items, query, (item) =>
		[
			item.itemId,
			findItemName(itemCatalog, item.itemId),
			item.itemType,
			item.itemNum,
		].join(' '),
	);
}

export function filterVisibleItemCatalog(
	catalog: ItemCatalogEntry[],
	query: string,
): ItemCatalogEntry[] {
	return filterRows(
		catalog.filter((item) => !isSiscaItemId(item.itemId)),
		query,
		(item) =>
			[item.itemId, item.name, item.itemType, item.itemCategory].join(' '),
	);
}

export function isSiscaItemId(itemId: number): boolean {
	return itemId === 1001001 || itemId === 1002001;
}

function filterRows<Row>(
	rows: Row[],
	query: string,
	createSearchText: (row: Row) => string,
): Row[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return rows;
	}
	return rows.filter((row) =>
		createSearchText(row).toLowerCase().includes(normalized),
	);
}
