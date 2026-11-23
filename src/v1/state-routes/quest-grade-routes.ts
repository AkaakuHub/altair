import { Hono } from 'hono';
import type { StateRouteContext } from '../route-support/state-route-context.ts';
import { registerGradeChallengeRoutes } from './quest-grade-challenge-routes.ts';
import { registerGradeQuestListRoutes } from './quest-grade-list-routes.ts';
import { registerGradeQuestResultRoutes } from './quest-grade-result-routes.ts';
import { registerGradeQuestRetireRoutes } from './quest-grade-retire-routes.ts';
import { registerGradeQuestSessionRoutes } from './quest-grade-session-routes.ts';

export function createGradeQuestRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	registerGradeQuestListRoutes(app, routeContext);
	registerGradeChallengeRoutes(app, routeContext);
	registerGradeQuestSessionRoutes(app, routeContext);
	registerGradeQuestResultRoutes(app, routeContext);
	registerGradeQuestRetireRoutes(app, routeContext);
	return app;
}
