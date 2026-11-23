import type { createWithstationMessageCardResponse } from '../responses/withstation-response.ts';
import type {
	createWithstationInfoResponse,
	createWithstationPrizeResponse,
} from '../responses/withstation-session-response.ts';
import type { createWithstationGiftResponse } from '../route-support/withstation-gift-response.ts';
import type { ResultResponse } from './common-response-types.ts';
import type {
	LiveMessageCardRequest,
	LivePrizeQueryRequest,
	WithliveGiftRequest,
	WithliveSetStarRequest,
} from './live-broadcast-response-types.ts';
export type WithstationGiftResponse = ReturnType<
	typeof createWithstationGiftResponse
>;
export type WithstationMessageCardResponse = ReturnType<
	typeof createWithstationMessageCardResponse
>;
export type WithstationInfoResponse = ReturnType<
	typeof createWithstationInfoResponse
>;
export type WithstationPrizeResponse = ReturnType<
	typeof createWithstationPrizeResponse
>;
export type WithstationStarsResponse = ResultResponse;
export type WithstationGiftRequest = Pick<
	WithliveGiftRequest,
	'live_id' | 'user_item_id' | 'use_own_amount'
>;
export type WithstationMessageCardRequest = Pick<
	LiveMessageCardRequest,
	'live_id' | 'user_item_id' | 'message'
>;
export type WithstationStarsRequest = WithliveSetStarRequest;
export type WithstationPrizeRequest = LivePrizeQueryRequest;
export type WithstationInfoRequest = {
	live_id?: string;
	play_time_ms?: number;
};
