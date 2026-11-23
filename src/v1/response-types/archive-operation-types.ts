import type { createArchiveCameraSelectionResponse } from '../../application/archive-camera/selection.ts';
import type { getWithStationListFromDatabase } from '../active-master-database/archive-list-responses.ts';
import type {
	createArchiveGiftResponse,
	createArchivePrizeResponse,
} from '../responses/archive-award-response.ts';
import type { createArchiveListResponse } from '../responses/archive-list-response-service.ts';
import type { createArchiveRankingResponse } from '../responses/archive-ranking-response.ts';
import type { createArchiveCommentResponse } from '../route-support/archive-comment-response.ts';
import type { WithliveSetStarRequest } from './live-broadcast-response-types.ts';
import type { WithstationGiftRequest } from './withstation-session-response-types.ts';
export type ArchiveGiftResponse = ReturnType<typeof createArchiveGiftResponse>;
export type ArchivePrizeResponse = ReturnType<
	typeof createArchivePrizeResponse
>;
export type ArchiveCommentResponse = ReturnType<
	typeof createArchiveCommentResponse
>;
export type ArchiveCameraResponse = NonNullable<
	ReturnType<typeof createArchiveCameraSelectionResponse>
>;
export type ArchiveRankingResponse = ReturnType<
	typeof createArchiveRankingResponse
>;
export type ArchiveStationListResponse = ReturnType<
	typeof getWithStationListFromDatabase
>['body'];
export type ArchiveCatalogResponse = ReturnType<
	typeof createArchiveListResponse
>;
export type ArchiveGiftRequest = WithstationGiftRequest;
export type ArchivePrizeRequest = { present_box_id?: string };
export type ArchiveStarsRequest = WithliveSetStarRequest;
export type ArchiveCameraRequest = {
	live_id: string;
	camera_type: number;
	focus_character_id?: number;
};
export type ArchiveRankingRequest = {
	target_period: 'current' | 'previous';
	member_id?: number;
};
export type ArchiveCommentRequest = {
	live_id?: string;
	play_time_second?: number;
};
export type ArchiveCatalogRequest = {
	live_type?: number;
	has_withlive_extra?: number;
	has_withlive_extra_admission?: number;
	characters?: { character_id: number; appearance?: number }[];
	sort?: string;
	order?: string;
	offset?: number;
	limit?: number;
};

import type { SavedArchiveDetail } from './archive/savedArchiveDetail.ts';
import type { SavedStationDetail } from './archive/savedStationDetail.ts';
export type ArchiveDetailResponse = SavedArchiveDetail;
export type ArchiveStationDetailResponse = SavedStationDetail;
export type ArchiveWithliveInfoPostResponse =
	| ArchiveDetailResponse
	| ArchiveCommentResponse;
export type ArchiveDetailRequest = { archives_id: string };
export type ArchiveStationDetailRequest = { withstation_id: string };
export type ArchiveWithliveInfoPostRequest = string | { archives_id?: string };
