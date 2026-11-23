import type { Context } from 'hono';
import { projectArchivePlaybackCursor } from '../../application/archive-playback-cursor-projection.ts';
import { hasArchiveExtraAdmission } from '../../application/archive-prize-progress.ts';
import { getGiftLiveIdentityFingerprint } from '../../master-data/archive-identity.ts';
import { getArchivePrizeMasterFromDatabase } from '../../master-data/archive-master-data.ts';
import { findArchiveGiftPoint } from '../../state/archive-gift-state.ts';
import {
	readCurrentWithliveArchiveSecond,
	toWithliveArchiveCommentSecond,
} from '../../state/archive-playback-cursor.ts';
import {
	createArchiveCommentResponse,
	readCommentPlayTimeSecond,
} from './archive-comment-response.ts';
import { resolveMasterReleaseBoundSessionDatabase } from './master-release-bound-session.ts';
import { getRequestUserArchiveCollectionState } from './request-user-state.ts';
import { persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function respondArchiveWithliveInfo(
	c: Context,
	routeContext: StateRouteContext,
): Response {
	const session = getRequestUserArchiveCollectionState(c, routeContext);
	if (session instanceof Response) {
		return session;
	}
	const queryLiveId = c.req.query('live_id');
	const querySecond = readCommentPlayTimeSecond(
		c.req.query('play_time_second'),
	);
	const canonicalCursor =
		queryLiveId !== undefined && queryLiveId.length > 0
			? {
					liveId: queryLiveId,
					playTimeSecond: toWithliveArchiveCommentSecond(
						session.collection,
						queryLiveId,
						querySecond ?? 0,
					),
				}
			: querySecond !== undefined
				? {
						liveId: session.collection.currentWithliveArchiveId ?? '',
						playTimeSecond: toWithliveArchiveCommentSecond(
							session.collection,
							session.collection.currentWithliveArchiveId ?? '',
							querySecond,
						),
					}
				: readCurrentWithliveArchiveSecond(
						session.collection,
						routeContext.date.currentDate(),
					);
	persistRouteStateIfChanged(routeContext, session.created);
	if (canonicalCursor === undefined || canonicalCursor.liveId.length === 0) {
		return c.json(createArchiveCommentResponse(undefined));
	}
	const database =
		queryLiveId !== undefined && queryLiveId.length > 0
			? routeContext.resolveRequestMasterRelease(c, session.user).database
			: resolveMasterReleaseBoundSessionDatabase(c, routeContext, {
					masterReleaseId:
						session.collection.currentWithliveArchiveMasterReleaseId,
				});
	if (database instanceof Response) return database;
	const archivePrizeMaster = getArchivePrizeMasterFromDatabase(
		database,
		canonicalCursor.liveId,
	);
	const commentCursor = projectArchivePlaybackCursor(
		canonicalCursor,
		(liveId) => liveId === archivePrizeMaster?.liveId,
	);
	if (commentCursor === undefined) {
		return c.json(createArchiveCommentResponse(undefined));
	}
	const hasExtraAdmission = hasArchiveExtraAdmission(
		findArchiveGiftPoint(
			routeContext.state.archiveGiftPoints,
			session.user.playerId,
			commentCursor.liveId,
			getGiftLiveIdentityFingerprint(
				database,
				'withlive',
				commentCursor.liveId,
			),
		),
		archivePrizeMaster,
	);
	return c.json(
		createArchiveCommentResponse(
			routeContext.getCommentsRepository(),
			commentCursor.liveId,
			commentCursor.playTimeSecond,
			hasExtraAdmission,
		),
	);
}
