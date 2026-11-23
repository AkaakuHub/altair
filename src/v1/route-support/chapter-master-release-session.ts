import type { Context } from 'hono';
import { getChapterProvenance } from '../../master-data/chapter-identity.ts';
import { getActiveChapterMasterFromDatabase } from '../../master-data/chapter-master-data.ts';
import { ensureChapterRuntimeState } from '../../server-state.ts';
import { ensureUserChapterState } from '../../state/chapter-aggregate-state.ts';
import { getRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function getChapterClaimMasterReleaseSession(
	c: Context,
	routeContext: StateRouteContext,
) {
	const user = getRequestUser(c, routeContext);
	if (user instanceof Response) return user;
	const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
	const master = getActiveChapterMasterFromDatabase(
		masterRelease.database,
		ensureChapterRuntimeState(routeContext.state),
	);
	const provenance = getChapterProvenance(
		masterRelease.database,
		masterRelease.masterReleaseId,
		master.chapterId,
	);
	if (provenance === undefined)
		return routeContext.respondError(c, 'chapterCategoryNotFound');
	const result = ensureUserChapterState(
		routeContext.state.userChapters,
		user.playerId,
		master,
		provenance,
	);
	routeContext.state.userChapters = result.chapters;
	return {
		user,
		database: masterRelease.database,
		masterReleaseId: masterRelease.masterReleaseId,
		master,
		provenance,
		chapter: result.chapter,
	};
}
