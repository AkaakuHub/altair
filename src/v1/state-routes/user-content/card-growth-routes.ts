import { Hono } from 'hono';
import type {
	RhythmGameSkillLevelUpRequest,
	RhythmGameSkillLevelUpResponse,
} from '../../response-types/rhythm-game-skill-level-response.ts';
import { apkDumpTypedEndpoint } from '../../route-support/endpoint-source.ts';
import { levelUpRhythmGameSkill } from '../../route-support/rhythm-game-skill-level-handler.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';
import { createCardEvolutionRoutes } from './card-growth/card-evolution-routes.ts';
import { createCardLimitBreakRoutes } from './card-growth/card-limit-break-routes.ts';
import { createCardSkillGrowthRoutes } from './card-growth/card-skill-growth-routes.ts';
import { createCardStyleGrowthRoutes } from './card-growth/card-style-growth-routes.ts';

export function createCardGrowthRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();

	app.route('/', createCardStyleGrowthRoutes(routeContext));
	app.route('/', createCardEvolutionRoutes(routeContext));
	app.route('/', createCardLimitBreakRoutes(routeContext));
	app.route('/', createCardSkillGrowthRoutes(routeContext));
	apkDumpTypedEndpoint<
		RhythmGameSkillLevelUpRequest,
		RhythmGameSkillLevelUpResponse
	>();
	app.post('/v1/user/card/rhythm_game_skill_level_up', (c) =>
		levelUpRhythmGameSkill(c, routeContext),
	);

	return app;
}
