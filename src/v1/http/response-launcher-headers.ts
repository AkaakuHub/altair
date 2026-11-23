import {
	type ActiveGachaHeaderState,
	getActiveGachaHeaderState,
} from '../../application/gacha-availability-service.ts';
import type { ServerState } from '../../server-state-schema.ts';
import { createLauncherInfoHeader } from '../../state/launcher-info-state.ts';
import type { ResponseHeaderContext } from './response-header-context.ts';

export function renderLauncherHeaderValue(
	name: string,
	state: ServerState,
	fanLevel: number,
	context: ResponseHeaderContext,
): string | undefined {
	switch (name) {
		case 'launcher_info': {
			const gachaHeaderState = getResponseGachaHeaderState(context, state);
			return JSON.stringify(
				createLauncherInfoHeader(state, fanLevel, {
					hasActiveGacha: gachaHeaderState.hasActiveGacha,
				}),
			);
		}
		case 'is_party_gacha_underway':
			return String(getResponseGachaHeaderState(context, state).hasPartyGacha);
		case 'new_gacha_unreadable_type':
			return String(
				getResponseGachaHeaderState(context, state).newGachaUnreadableType,
			);
		default:
			return undefined;
	}
}

function getResponseGachaHeaderState(
	context: ResponseHeaderContext,
	state: ServerState,
): ActiveGachaHeaderState {
	return (
		context.gachaHeaderState ??
		getActiveGachaHeaderState(
			context.getGachaSeriesAdminSummary(),
			state.gachaSeriesActivations,
		)
	);
}
