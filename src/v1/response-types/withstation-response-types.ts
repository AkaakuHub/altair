import type { GiftPointRankingsResponse } from './live-broadcast-response-types.ts';

export type WithstationGiftPtRankingsRequest = { live_id: string };
export type WithstationGiftPtRankingsResponse = GiftPointRankingsResponse;

export type WithstationCommentRequest = {
	live_id: string;
	comment: string;
	play_time_ms?: number;
};

export type WithstationCommentResponse = {
	timeline_id: string;
	name_color: string;
	text_color: string;
	background_color: string;
	comment: string;
	timeline_time_ms: number;
};
