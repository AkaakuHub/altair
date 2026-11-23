import type { Database } from 'bun:sqlite';
import { getItemIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import { getItemDefinitionByItemIdFromDatabase } from '../../master-data/item-master.ts';
import {
	getLimitBreakMaterialConvertMasterFromDatabase,
	getLimitBreakMaterialConvertRatesFromDatabase,
} from '../../master-data/shop-exchange-purchase-master.ts';
import type { ServerState } from '../../server-state-schema.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import {
	addUserItemQuantity,
	canApplyUserItemProvenance,
} from '../../state/user-item-mutation.ts';
import { consumeMasterReleaseUserItems } from './item-consumption.ts';

const PRODUCT_ITEM_TYPE_ITEM = 1;

type LimitBreakMaterialConvertItem = {
	item_id: number;
	get_num: number;
};

export function convertLimitBreakMaterialsToItems(
	database: Database,
	sourceMasterReleaseId: string,
	state: ServerState,
	playerId: string,
	inventory: UserInventoryState,
): LimitBreakMaterialConvertItem[] | undefined {
	const materialItemIdsByRarity = new Map<number, number[]>();
	for (const material of getLimitBreakMaterialConvertMasterFromDatabase(
		database,
	)) {
		const itemIds = materialItemIdsByRarity.get(material.rarity) ?? [];
		itemIds.push(material.itemId);
		materialItemIdsByRarity.set(material.rarity, itemIds);
	}

	const getItemList: LimitBreakMaterialConvertItem[] = [];
	const rates = getLimitBreakMaterialConvertRatesFromDatabase(database);
	const productProvenanceByItemId = new Map(
		rates.map((rate) => {
			const identityFingerprint = getItemIdentityFingerprint(
				database,
				rate.productItemId,
			);
			return identityFingerprint === undefined
				? ([rate.productItemId, undefined] as const)
				: ([
						rate.productItemId,
						{ sourceMasterReleaseId, identityFingerprint },
					] as const);
		}),
	);
	for (const rate of rates) {
		if (
			rate.materialNum <= 0 ||
			rate.productItemType !== PRODUCT_ITEM_TYPE_ITEM
		) {
			return undefined;
		}
		const materialItemIds = materialItemIdsByRarity.get(rate.rarity) ?? [];
		const materialCount = materialItemIds.reduce(
			(total, itemId) =>
				total + (findUserItemByItemId(inventory, itemId)?.itemNum ?? 0),
			0,
		);
		const convertCount = Math.floor(materialCount / rate.materialNum);
		if (convertCount <= 0) {
			continue;
		}
		const provenance = productProvenanceByItemId.get(rate.productItemId);
		if (
			provenance === undefined ||
			!canApplyUserItemProvenance(inventory, rate.productItemId, provenance)
		) {
			return undefined;
		}
		const productDefinition = getItemDefinitionByItemIdFromDatabase(
			database,
			rate.productItemId,
		);
		if (!productDefinition) {
			return undefined;
		}
		let remainingMaterialNum = convertCount * rate.materialNum;
		const consumptions = [];
		for (const materialItemId of materialItemIds) {
			if (remainingMaterialNum <= 0) {
				break;
			}
			const materialItem = findUserItemByItemId(inventory, materialItemId);
			if (!materialItem || materialItem.itemNum <= 0) {
				continue;
			}
			const consumeNum = Math.min(materialItem.itemNum, remainingMaterialNum);
			consumptions.push({
				userItemId: '',
				itemId: materialItemId,
				itemNum: consumeNum,
			});
			remainingMaterialNum -= consumeNum;
		}
		if (
			remainingMaterialNum !== 0 ||
			!consumeMasterReleaseUserItems(
				database,
				sourceMasterReleaseId,
				inventory,
				consumptions,
			)
		) {
			return undefined;
		}
		const getNum = convertCount * rate.productItemNum;
		if (
			!addUserItemQuantity(
				state,
				playerId,
				productDefinition,
				getNum,
				provenance,
			)
		) {
			return undefined;
		}
		addGetItem(getItemList, rate.productItemId, getNum);
	}
	return getItemList;
}

function addGetItem(
	getItemList: LimitBreakMaterialConvertItem[],
	itemId: number,
	getNum: number,
): void {
	const existing = getItemList.find((item) => item.item_id === itemId);
	if (existing) {
		existing.get_num += getNum;
		return;
	}
	getItemList.push({
		item_id: itemId,
		get_num: getNum,
	});
}
