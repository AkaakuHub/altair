import { Hono } from 'hono';
import type { StateRouteContext } from '../route-support/state-route-context.ts';
import { createRhythmGameGrandPrixRoutes } from './rhythm-game-grand-prix-routes.ts';
import { createBeginnerMissionRoutes } from './user-content/beginner-mission-routes.ts';
import { createCardRoutes } from './user-content/card-routes.ts';
import { createCollectionRoutes } from './user-content/collection-routes.ts';
import { createCommonMissionRoutes } from './user-content/common-mission-routes.ts';
import { createContentReleaseRoutes } from './user-content/content-release-routes.ts';
import { createItemRoutes } from './user-content/item-routes.ts';
import { createRhythmGameDeckRoutes } from './user-content/rhythm-game-deck-routes.ts';
import { createRhythmGameHomeRoutes } from './user-content/rhythm-game-home-routes.ts';
import { createRhythmGameLiveRoutes } from './user-content/rhythm-game-live-routes.ts';
import { createUserDeckRoutes } from './user-content/user-deck-routes.ts';

export function createUserContentRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	app.route('/', createCardRoutes(routeContext));
	app.route('/', createItemRoutes(routeContext));
	app.route('/', createBeginnerMissionRoutes(routeContext));
	app.route('/', createCollectionRoutes(routeContext));
	app.route('/', createCommonMissionRoutes(routeContext));
	app.route('/', createContentReleaseRoutes(routeContext));
	app.route('/', createUserDeckRoutes(routeContext));
	app.route('/', createRhythmGameHomeRoutes(routeContext));
	app.route('/', createRhythmGameLiveRoutes(routeContext));
	app.route('/', createRhythmGameDeckRoutes(routeContext));
	app.route('/', createRhythmGameGrandPrixRoutes(routeContext));
	return app;
}
