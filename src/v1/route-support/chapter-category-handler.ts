import type { Context } from 'hono';
import { getChapterMissionsFromDatabase } from '../../master-data/chapter-master-data.ts';
import { ensureGrandPrixRuntimeState } from '../../server-state.ts';
import { readJson } from '../http/read-json.ts';
import { createChapterCategoryInfoResponse } from '../responses/chapter-response.ts';
import { getChapterMissionGroup } from './chapter-mission-group.ts';
import { readChapterCategoryRequest } from './chapter-request.ts';
import { getRequestUserChapterState } from './request-user-state.ts';
import { persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createChapterCategoryHandler(routeContext: StateRouteContext) {
	return async (c: Context) => {
		const { categoryId } = readChapterCategoryRequest(
			await readJson(c.req.raw),
		);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		const result = getRequestUserChapterState(c, routeContext);
		if (result instanceof Response) return result;
		const response =
			categoryId === undefined
				? undefined
				: createChapterCategoryInfoResponse(
						result.value,
						categoryId,
						result.master,
						getChapterMissionsFromDatabase(
							result.database,
							categoryId,
							getChapterMissionGroup(
								categoryId,
								ensureGrandPrixRuntimeState(routeContext.state).grandPrixType,
							),
						),
					);
		if (!response)
			return routeContext.respondError(c, 'chapterCategoryNotFound');
		persistRouteStateIfChanged(routeContext, result.created);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		return c.json(response);
	};
}
