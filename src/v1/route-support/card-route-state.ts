import { persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function persistCardRouteStateIfChanged(
	routeContext: StateRouteContext,
	...stateCreatedResults: boolean[]
): void {
	if (stateCreatedResults.some((created) => created)) {
		persistRouteState(routeContext);
	}
}
