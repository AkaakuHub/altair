import type { ServerState } from '../../server-state-schema.ts';
import {
	getSelectedProfileDesignPartsInfoForOfficialResponse,
	type UserProfileDesignState,
} from '../../state/profile-design-state.ts';

type ProfilePartsSource = Pick<ServerState, 'userProfileDesigns'>;

export function createProfileIconPartsInfo(
	state: ProfilePartsSource,
	playerId: string,
): string {
	return createProfileDesignPartsInfo(state, playerId, 2);
}

export function createProfileCardPartsInfo(
	state: ProfilePartsSource,
	playerId: string,
): string {
	return createProfileDesignPartsInfo(state, playerId, 1);
}

function createProfileDesignPartsInfo(
	state: ProfilePartsSource,
	playerId: string,
	designType: 1 | 2,
): string {
	return getSelectedProfileDesignPartsInfoForOfficialResponse(
		findRequiredProfileDesign(state, playerId),
		designType,
	);
}

function findRequiredProfileDesign(
	state: ProfilePartsSource,
	playerId: string,
): UserProfileDesignState {
	const design = state.userProfileDesigns.find(
		(value) => value.playerId === playerId,
	);
	if (!design) {
		throw new Error(`profile design not found: ${playerId}`);
	}
	return design;
}
