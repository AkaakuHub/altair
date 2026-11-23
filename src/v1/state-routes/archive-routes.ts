import { Hono } from 'hono';
import type {
	ArchiveCameraRequest,
	ArchiveCameraResponse,
	ArchiveCatalogRequest,
	ArchiveCatalogResponse,
	ArchiveCommentRequest,
	ArchiveCommentResponse,
	ArchiveDetailRequest,
	ArchiveDetailResponse,
	ArchiveGiftRequest,
	ArchiveGiftResponse,
	ArchivePrizeRequest,
	ArchivePrizeResponse,
	ArchiveRankingRequest,
	ArchiveRankingResponse,
	ArchiveStarsRequest,
	ArchiveStationDetailRequest,
	ArchiveStationDetailResponse,
	ArchiveStationListResponse,
	ArchiveWithliveInfoPostRequest,
	ArchiveWithliveInfoPostResponse,
} from '../response-types/archive-operation-types.ts';
import type { NullResponse } from '../response-types/common-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type { EmptyLiveBroadcastRequest } from '../response-types/live-broadcast-response-types.ts';
import type { ArchiveHomeResponse } from '../responses/live-broadcast-home-response.ts';
import {
	createArchiveGiftHandler,
	createArchivePrizeGetHandler,
	createArchivePrizePostHandler,
	createArchiveStarsHandler,
} from '../route-support/archive-award-handlers.ts';
import { createArchiveCameraHandler } from '../route-support/archive-camera-handler.ts';
import {
	createArchiveHomeHandler,
	createArchiveWithStationListHandler,
} from '../route-support/archive-collection-handlers.ts';
import {
	createArchiveFesDataHandler,
	createArchiveWithDataHandler,
	createArchiveWithliveInfoGetHandler,
	createArchiveWithliveInfoPostHandler,
	createArchiveWithStationDataHandler,
} from '../route-support/archive-detail-handlers.ts';
import {
	createArchiveListHandler,
	createArchiveRankingListHandler,
} from '../route-support/archive-list-handler.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../route-support/endpoint-source.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createArchiveRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	typedEndpoint<ArchiveCameraRequest, ArchiveCameraResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/archive/set_fes_camera',
		createArchiveCameraHandler(routeContext),
	);
	apkDumpTypedEndpoint<EmptyLiveBroadcastRequest, ArchiveHomeResponse>();
	app.post('/v1/archive/get_home', createArchiveHomeHandler(routeContext));
	typedEndpoint<ArchiveCatalogRequest, ArchiveCatalogResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/archive/get_archive_list',
		createArchiveListHandler(routeContext),
	);
	typedEndpoint<ArchiveDetailRequest, ArchiveDetailResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/archive/get_with_archive_data',
		createArchiveWithDataHandler(routeContext),
	);
	typedEndpoint<ArchiveCommentRequest, ArchiveCommentResponse>({
		requiresSession: true,
	});
	app.get(
		'/v1/archive/withlive_info',
		createArchiveWithliveInfoGetHandler(routeContext),
	);
	typedEndpoint<
		ArchiveWithliveInfoPostRequest,
		ArchiveWithliveInfoPostResponse
	>({ requiresSession: true });
	app.post(
		'/v1/archive/withlive_info',
		createArchiveWithliveInfoPostHandler(routeContext),
	);
	typedEndpoint<ArchiveDetailRequest, ArchiveDetailResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/archive/get_fes_archive_data',
		createArchiveFesDataHandler(routeContext),
	);
	typedEndpoint<EmptyRequest, ArchiveStationListResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/archive/get_with_station_list',
		createArchiveWithStationListHandler(routeContext),
	);
	typedEndpoint<ArchiveStationDetailRequest, ArchiveStationDetailResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/archive/get_with_station_data',
		createArchiveWithStationDataHandler(routeContext),
	);
	typedEndpoint<ArchiveRankingRequest, ArchiveRankingResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/archive/get_ranking_list',
		createArchiveRankingListHandler(routeContext),
	);
	typedEndpoint<ArchiveGiftRequest, ArchiveGiftResponse>({
		requiresSession: true,
	});
	app.post('/v1/archive/withlive_gift', createArchiveGiftHandler(routeContext));
	typedEndpoint<ArchivePrizeRequest, ArchivePrizeResponse>({
		requiresSession: true,
	});
	app.get(
		'/v1/archive/withlive_prize',
		createArchivePrizeGetHandler(routeContext),
	);
	typedEndpoint<ArchivePrizeRequest, ArchivePrizeResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/archive/withlive_prize',
		createArchivePrizePostHandler(routeContext),
	);
	typedEndpoint<ArchiveStarsRequest, NullResponse>({ requiresSession: true });
	app.post(
		'/v1/archive/withlive_stars',
		createArchiveStarsHandler(routeContext),
	);
	return app;
}
