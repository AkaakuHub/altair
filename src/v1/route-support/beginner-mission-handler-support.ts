import type { Context } from 'hono';
import { runRewardClaimMutation } from '../../application/reward-claim-service.ts';
import type { ServerState } from '../../server-state-schema.ts';
import { BeginnerMissionRewardUnavailableError } from './beginner-mission-rewards.ts';
import { persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

type BeginnerMissionMutationResult<T> =
	| { succeeded: true; value: T }
	| { succeeded: false; response: Response };

export function runBeginnerMissionRewardMutation<T>(
	c: Context,
	routeContext: StateRouteContext,
	state: ServerState,
	mutation: () => T,
): BeginnerMissionMutationResult<T> {
	try {
		return {
			succeeded: true,
			value: runRewardClaimMutation(state, mutation),
		};
	} catch (error) {
		if (!(error instanceof BeginnerMissionRewardUnavailableError)) {
			throw error;
		}
		return {
			succeeded: false,
			response: routeContext.respondError(
				c,
				'beginnerMissionRewardSeedNotFound',
			),
		};
	}
}

export function completeBeginnerMissionRewardMutation(
	c: Context,
	routeContext: StateRouteContext,
): void {
	persistRouteState(routeContext);
	routeContext.applyResponseHeaders(c, routeContext.defaultHeaders);
}
