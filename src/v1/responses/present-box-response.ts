import type {
	PresentBoxItem,
	UserPresentBoxState,
} from '../../state/user-presents-state.ts';
import type {
	PresentBoxListResponse,
	PresentBoxReceiptAllResponse,
	PresentBoxReceiptResponse,
	PresentBoxResponseItem,
} from '../response-types/present-box-response-types.ts';

export function createPresentBoxListResponse(
	presentBox: UserPresentBoxState,
	page: number,
): PresentBoxListResponse {
	if (page > 1) {
		return {
			page,
			total_count: 0,
		};
	}
	return {
		items: cloneRecords(presentBox.presentList),
		page: 1,
		total_count: presentBox.presentList.length,
	};
}

export function createPresentBoxHistoryResponse(
	presentBox: UserPresentBoxState,
	page: number,
): PresentBoxListResponse {
	if (page > 1) {
		return {
			page,
			total_count: 0,
		};
	}
	return {
		items: cloneRecords(presentBox.receivedPresentList),
		page: 1,
		total_count: presentBox.receivedPresentList.length,
	};
}

export function createPresentBoxReceiptAllResponse(
	receivedItems: PresentBoxItem[],
): PresentBoxReceiptAllResponse {
	return {
		grade_up_data: null,
		is_not_received_grade_reward: false,
		receipt_exclude_items: null,
		receipt_failed_items: null,
		receipt_success_items: cloneRecords(receivedItems),
		result: 1,
	};
}

export function createPresentBoxReceiptResponse(
	receivedItem: PresentBoxItem,
): PresentBoxReceiptResponse {
	return {
		grade_up_data: null,
		is_not_received_grade_reward: false,
		receipt_failed_item: null,
		receipt_success_item: cloneRecord(receivedItem),
		result: 1,
	};
}

function cloneRecords(values: PresentBoxItem[]): PresentBoxResponseItem[] {
	return values.map(cloneRecord);
}

function cloneRecord(value: PresentBoxItem): PresentBoxResponseItem {
	return {
		comment: value.comment,
		d_present_boxes_id: value.d_present_boxes_id,
		error_code: value.error_code,
		error_message: value.error_message,
		error_title: value.error_title,
		exchange_item_data: value.exchange_item_data,
		get_time: value.get_time,
		item_id: value.item_id,
		item_type: value.item_type,
		life_time_date: value.life_time_date,
		life_time_days: value.life_time_days,
		life_time_type: value.life_time_type,
		live_id: value.live_id,
		name: value.name,
		num: value.num,
		receipt_limit_time: value.receipt_limit_time,
		receipted_time: value.receipted_time,
	};
}
