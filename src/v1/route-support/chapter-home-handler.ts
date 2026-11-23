import type { Context } from 'hono';
import { getChapterRankFromDatabase } from '../../master-data/chapter-master-data.ts';
import { createChapterHomeResponse } from '../responses/chapter-response.ts';
import { getRequestUserChapterState } from './request-user-state.ts';
import { persistRouteStateIfChanged } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createChapterHomeHandler(routeContext: StateRouteContext) {
	return (c: Context) => {
		const result = getRequestUserChapterState(c, routeContext);
		if (result instanceof Response) return result;
		persistRouteStateIfChanged(routeContext, result.created);
		routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
		return c.json(
			createChapterHomeResponse(
				result.value,
				result.master,
				getChapterRankFromDatabase(result.database, result.value.currentPoint),
			),
		);
	};
}
