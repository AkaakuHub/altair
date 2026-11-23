import type {
	PresentBoxItem,
	UserPresentBoxState,
} from '../../../../../../src/state/user-presents-state.ts';
import {
	type JsonRecord,
	readNumber,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

const unsetDate = '0001-01-01T00:00:00Z';

export function createPresentBoxFromResponses(
	playerId: string,
	listResponse: JsonRecord | undefined,
	historyResponse: JsonRecord | undefined,
): UserPresentBoxState | null {
	if (listResponse === undefined && historyResponse === undefined) {
		return null;
	}
	return {
		playerId,
		presentList: readPresentItems(listResponse),
		receivedPresentList: readPresentItems(historyResponse),
	};
}

function readPresentItems(response: JsonRecord | undefined): PresentBoxItem[] {
	if (response === undefined) {
		return [];
	}
	const sourceItems = Array.isArray(response.items)
		? response.items
		: response.history_items;
	return readRecordArray(sourceItems)
		.map(createPresentBoxItem)
		.filter((item): item is PresentBoxItem => item !== null);
}

function createPresentBoxItem(item: JsonRecord): PresentBoxItem | null {
	const presentBoxId = readString(item.d_present_boxes_id);
	const itemId = readNumber(item.item_id);
	const itemType = readNumber(item.item_type);
	const lifeTimeType = readNumber(item.life_time_type);
	const num = readNumber(item.num);
	if (
		presentBoxId === null ||
		itemId === null ||
		itemType === null ||
		lifeTimeType === null ||
		num === null
	) {
		return null;
	}
	return {
		comment: readString(item.comment) ?? '',
		d_present_boxes_id: presentBoxId,
		error_code: readString(item.error_code) ?? '',
		error_message: readString(item.error_message) ?? '',
		error_title: readString(item.error_title) ?? '',
		exchange_item_data: null,
		get_time: readString(item.get_time) ?? unsetDate,
		item_id: itemId,
		item_type: itemType,
		life_time_date: null,
		life_time_days: null,
		life_time_type: lifeTimeType,
		live_id: readString(item.live_id) ?? '',
		name: readString(item.name) ?? '',
		num,
		receipt_limit_time: readString(item.receipt_limit_time),
		receipted_time: readString(item.receipted_time),
	};
}
