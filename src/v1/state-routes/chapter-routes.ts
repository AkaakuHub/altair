import { Hono } from 'hono';
import type { ChapterHomeResponse } from '../response-types/archive-chapter-login-response-types.ts';
import type {
	ChapterCategoryRequest,
	ChapterCategoryResponse,
	ChapterClaimRequest,
	ChapterRewardsResponse,
} from '../response-types/chapter-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import { createChapterCategoryHandler } from '../route-support/chapter-category-handler.ts';
import { createChapterHomeHandler } from '../route-support/chapter-home-handler.ts';
import {
	createChapterClaimRewardsHandler,
	createChapterPointRewardsHandler,
} from '../route-support/chapter-reward-handlers.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createChapterRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	typedEndpoint<EmptyRequest, ChapterHomeResponse>();
	app.post('/v1/chapter/home', createChapterHomeHandler(routeContext));
	typedEndpoint<ChapterCategoryRequest, ChapterCategoryResponse>();
	app.post(
		'/v1/chapter/category_info',
		createChapterCategoryHandler(routeContext),
	);
	typedEndpoint<EmptyRequest, ChapterRewardsResponse>();
	app.post(
		'/v1/chapter/get_point_rewards',
		createChapterPointRewardsHandler(routeContext),
	);
	typedEndpoint<ChapterClaimRequest, ChapterRewardsResponse>();
	app.post(
		'/v1/chapter/claim_point_rewards',
		createChapterClaimRewardsHandler(routeContext),
	);
	return app;
}
