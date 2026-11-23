import type { Database } from 'bun:sqlite';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from '../state/entity-provenance.ts';

type GpPrizeIdentityRow = {
	id: number;
	product_item_type: number;
	product_item_id: number;
	material_item_type: number;
	material_item_id: number;
	reset_type: number;
};

type ItemExchangeIdentityRow = GpPrizeIdentityRow & {
	item_exchange_category_id: number;
	category_list_id: number;
	unlock_conditions: number;
	unlock_condition_value: number;
	display_conditions: number;
	display_condition_value: number;
};

export function createGpPrizeExchangeIdentityFingerprint(
	row: GpPrizeIdentityRow,
): EntityIdentityFingerprint {
	return {
		domain: 'gp-prize-exchange',
		value: JSON.stringify([
			row.id,
			row.product_item_type,
			row.product_item_id,
			row.material_item_type,
			row.material_item_id,
			row.reset_type,
		]),
	};
}

export function createItemExchangeIdentityFingerprint(
	row: ItemExchangeIdentityRow,
): EntityIdentityFingerprint {
	return {
		domain: 'item-exchange',
		value: JSON.stringify([
			row.id,
			row.item_exchange_category_id,
			row.product_item_type,
			row.product_item_id,
			row.material_item_type,
			row.material_item_id,
			row.reset_type,
			row.category_list_id,
			row.unlock_conditions,
			row.unlock_condition_value,
			row.display_conditions,
			row.display_condition_value,
		]),
	};
}

export function getGpPrizeExchangeProvenance(
	database: Database,
	sourceMasterReleaseId: string,
	exchangeId: number,
): EntityProvenance | undefined {
	const row = database
		.query<GpPrizeIdentityRow, [number]>(
			'SELECT id, product_item_type, product_item_id, material_item_type, material_item_id, reset_type FROM master_gp_prize_exchanges WHERE id = ?',
		)
		.get(exchangeId);
	return row === null
		? undefined
		: {
				sourceMasterReleaseId,
				identityFingerprint: createGpPrizeExchangeIdentityFingerprint(row),
			};
}

export function getItemExchangeProvenance(
	database: Database,
	sourceMasterReleaseId: string,
	exchangeId: number,
): EntityProvenance | undefined {
	const row = database
		.query<ItemExchangeIdentityRow, [number]>(
			[
				'SELECT id, item_exchange_category_id, product_item_type, product_item_id,',
				'material_item_type, material_item_id, reset_type, category_list_id,',
				'unlock_conditions, unlock_condition_value, display_conditions, display_condition_value',
				'FROM master_item_exchanges WHERE id = ?',
			].join(' '),
		)
		.get(exchangeId);
	return row === null
		? undefined
		: {
				sourceMasterReleaseId,
				identityFingerprint: createItemExchangeIdentityFingerprint(row),
			};
}
