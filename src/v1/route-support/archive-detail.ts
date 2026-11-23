import type { Context } from 'hono';
import { hasArchiveExtraAdmission } from '../../application/archive-prize-progress.ts';
import {
	getArchiveIdentityFingerprints,
	getArchiveProvenance,
	getGiftLiveIdentityFingerprint,
	type WatchedArchiveType,
} from '../../master-data/archive-identity.ts';
import {
	getArchivePrizeMasterFromDatabase,
	getWithStationPrizeMasterFromDatabase,
} from '../../master-data/archive-master-data.ts';
import {
	findArchiveGiftPoint,
	getArchiveGiftPointWithDefaults,
} from '../../state/archive-gift-state.ts';
import {
	setCurrentWithliveArchive,
	setCurrentWithstationArchive,
} from '../../state/archive-playback-cursor.ts';
import {
	markFesArchiveWatched,
	markWithliveArchiveWatched,
	projectArchiveWatchedHistory,
} from '../../state/archive-watched-history.ts';
import {
	getArchiveDetailFromDatabase,
	getWithStationDetailFromDatabase,
} from '../active-master-database/archive-detail-response-service.ts';
import { isJsonRecord } from './request-fields.ts';
import { getRequestUserArchiveCollectionState } from './request-user-state.ts';
import { persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

type ArchiveContentType = 'withlive' | 'fes' | 'withstation';

export function respondArchiveDetail(
	c: Context,
	routeContext: StateRouteContext,
	archiveId: string,
	archiveType: ArchiveContentType,
) {
	const { defaultHeaders, respondStored, state } = routeContext;
	const session = getRequestUserArchiveCollectionState(c, routeContext);
	if (session instanceof Response) {
		return session;
	}
	const masterRelease = routeContext.resolveRequestMasterRelease(
		c,
		session.user,
	);
	const database = masterRelease.database;
	const archivePrizeMaster =
		archiveType === 'withstation'
			? getWithStationPrizeMasterFromDatabase(database, archiveId)
			: getArchivePrizeMasterFromDatabase(database, archiveId);
	const archiveGiftPoint = findArchiveGiftPoint(
		state.archiveGiftPoints,
		session.user.playerId,
		archiveId,
		archiveType === 'withstation'
			? getGiftLiveIdentityFingerprint(database, 'withstation', archiveId)
			: getGiftLiveIdentityFingerprint(database, 'withlive', archiveId),
	);
	const detailResult =
		archiveType === 'withstation'
			? getWithStationDetailFromDatabase(
					database,
					archiveId,
					hasArchiveExtraAdmission(archiveGiftPoint, archivePrizeMaster),
				)
			: getArchiveDetailFromDatabase(
					database,
					archiveId,
					hasArchiveExtraAdmission(archiveGiftPoint, archivePrizeMaster),
				);
	const detail = detailResult?.response;
	if (detail) {
		let isCurrentArchiveChanged = false;
		applyArchiveGiftPoint(detail.body, archiveGiftPoint);
		if (archiveType === 'withlive') {
			isCurrentArchiveChanged = setCurrentWithliveArchive(
				session.collection,
				archiveId,
				masterRelease.masterReleaseId,
				readCurrentPlayTimeSecond(detail.body),
				readMainStartPlayTimeSecond(detail.body),
				detailResult.commentOffsetSecond,
				routeContext.date.currentDate(),
			);
		} else if (archiveType === 'withstation') {
			isCurrentArchiveChanged = setCurrentWithstationArchive(
				session.collection,
				archiveId,
				masterRelease.masterReleaseId,
				readCurrentPlayTimeSecond(detail.body),
				routeContext.date.currentDate(),
			);
		}
		const isArchiveWatched = markArchiveWatched(
			session.collection,
			database,
			masterRelease.masterReleaseId,
			archiveType,
			archiveId,
		);
		const watchedHistory = projectArchiveWatchedHistory(session.collection, {
			withliveFingerprints: getArchiveIdentityFingerprints(
				database,
				'withlive',
			),
			fesFingerprints: getArchiveIdentityFingerprints(database, 'fes'),
		});
		const missionSync = routeContext
			.resolveMissionProgress(c, session.user)
			.syncUserContent(session.user.playerId, {
				archiveCollection: watchedHistory,
			});
		persistRouteStateIfChanged(
			routeContext,
			session.created ||
				isCurrentArchiveChanged ||
				isArchiveWatched ||
				missionSync.progressChanged,
		);
	}
	return respondStored(c, defaultHeaders, detail);
}

function markArchiveWatched(
	collection: Parameters<typeof markWithliveArchiveWatched>[0],
	database: Parameters<typeof getArchiveProvenance>[0],
	masterReleaseId: string,
	archiveType: ArchiveContentType,
	archiveId: string,
): boolean {
	if (archiveType === 'withstation') return false;
	const watchedArchiveType: WatchedArchiveType = archiveType;
	const provenance = getArchiveProvenance(
		database,
		masterReleaseId,
		watchedArchiveType,
		archiveId,
	);
	if (provenance === undefined) return false;
	return watchedArchiveType === 'withlive'
		? markWithliveArchiveWatched(collection, archiveId, provenance)
		: markFesArchiveWatched(collection, archiveId, provenance);
}

function applyArchiveGiftPoint(
	body: unknown,
	archiveGiftPoint: ReturnType<typeof findArchiveGiftPoint>,
): void {
	if (!isJsonRecord(body)) {
		return;
	}
	const point = archiveGiftPoint
		? getArchiveGiftPointWithDefaults(archiveGiftPoint)
		: {
				totalUserGiftPoint: 0,
				totalUserGiftPointWithoutArchive: 0,
			};
	body.user_gift_pt_including_archive = point.totalUserGiftPoint;
	body.user_gift_pt_without_archive = point.totalUserGiftPointWithoutArchive;
	if ('user_gift_pt' in body) {
		body.user_gift_pt = point.totalUserGiftPoint;
	}
}

function readCurrentPlayTimeSecond(value: unknown): number {
	if (!isJsonRecord(value)) {
		return 0;
	}
	const currentPlayTimeSecond = value.current_play_time_second;
	return typeof currentPlayTimeSecond === 'number' &&
		Number.isSafeInteger(currentPlayTimeSecond) &&
		currentPlayTimeSecond >= 0
		? currentPlayTimeSecond
		: 0;
}

function readMainStartPlayTimeSecond(value: unknown): number {
	if (!isJsonRecord(value) || !Array.isArray(value.chapters)) {
		return 0;
	}
	const mainStartChapter = value.chapters.find(
		(chapter) =>
			isJsonRecord(chapter) &&
			chapter.is_extra === false &&
			typeof chapter.play_time_second === 'number' &&
			Number.isSafeInteger(chapter.play_time_second) &&
			chapter.play_time_second >= 0,
	);
	return isJsonRecord(mainStartChapter) &&
		typeof mainStartChapter.play_time_second === 'number'
		? mainStartChapter.play_time_second
		: 0;
}
