import { Hono } from 'hono';
import type { StateRouteContext } from '../route-support/state-route-context.ts';
import { createQuestLiveLifecycleRoutes } from './quest/quest-live-lifecycle-routes.ts';
import { createQuestLiveSettingRoutes } from './quest/quest-live-setting-routes.ts';
import { createQuestResultRoutes } from './quest/quest-result-routes.ts';
import { createQuestSkipRoutes } from './quest/quest-skip-routes.ts';
import { createQuestStageRoutes } from './quest/quest-stage-routes.ts';
import { createDailyQuestRoutes } from './quest-daily-routes.ts';
import { createQuestDreamRoutes } from './quest-dream-routes.ts';
import { createGradeQuestRoutes } from './quest-grade-routes.ts';
import { createGrandPrixQuestRoutes } from './quest-grand-prix-routes.ts';
import { createQuestMusicLearningRoutes } from './quest-music-learning-routes.ts';
import { createQuestStaminaRoutes } from './quest-stamina-routes.ts';

export function createQuestRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	app.route('/', createGrandPrixQuestRoutes(routeContext));
	app.route('/', createGradeQuestRoutes(routeContext));
	app.route('/', createQuestStageRoutes(routeContext));
	app.route('/', createQuestLiveSettingRoutes(routeContext));
	app.route('/', createQuestLiveLifecycleRoutes(routeContext));
	app.route('/', createQuestSkipRoutes(routeContext));
	app.route('/', createQuestResultRoutes(routeContext));
	app.route('/', createDailyQuestRoutes(routeContext));
	app.route('/', createQuestStaminaRoutes(routeContext));
	app.route('/', createQuestMusicLearningRoutes(routeContext));
	app.route('/', createQuestDreamRoutes(routeContext));
	return app;
}
