import type { PresentBoxItem } from '../../state/user-presents-state.ts';

export type PresentBoxResponseItem = Omit<
	PresentBoxItem,
	'rewardProvenance' | 'withstationPlaybackReward'
>;
export type PresentBoxPageRequest = { page?: number };
export type PresentBoxReceiptRequest = { d_present_boxes_id: string };
export type PresentBoxListResponse = {
	items?: PresentBoxResponseItem[];
	page: number;
	total_count: number;
};
export type PresentBoxReceiptAllResponse = {
	grade_up_data: null;
	is_not_received_grade_reward: false;
	receipt_exclude_items: null;
	receipt_failed_items: null;
	receipt_success_items: PresentBoxResponseItem[];
	result: 1;
};
export type PresentBoxReceiptResponse = {
	grade_up_data: null;
	is_not_received_grade_reward: false;
	receipt_failed_item: null;
	receipt_success_item: PresentBoxResponseItem;
	result: 1;
};
