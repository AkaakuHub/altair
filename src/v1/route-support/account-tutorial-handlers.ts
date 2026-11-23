import type { Context } from 'hono';
import {
	completeTutorial,
	ensureUserTutorialState,
	supportedTutorialIds,
} from '../../state/user-tutorial-state.ts';
import { readJson } from '../http/read-json.ts';
import type { ResultResponse } from '../response-types/common-response-types.ts';
import { getNumberField } from './request-fields.ts';
import { persistRouteState, withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export async function setTutorialStep(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return withRequestUser(c, context, async (requestUser) => {
		const tutorialId = getNumberField(await readJson(c.req.raw), 'tutorial_id');
		if (tutorialId !== undefined && supportedTutorialIds.has(tutorialId)) {
			const tutorial = ensureUserTutorialState(
				context.state,
				requestUser.playerId,
			).value;
			completeTutorial(tutorial, tutorialId);
		}
		persistRouteState(context);
		return c.json({ result: true } satisfies ResultResponse);
	});
}
