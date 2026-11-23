import type { ProfileTargetRequest } from './profile-request-types.ts';

export type FollowMutationRequest = ProfileTargetRequest & {
	follow_type: 1 | 2;
};
export type FriendCardRequest = {
	school_idol_stage_card_id?: string;
	rhythm_game_card_id?: string;
};
