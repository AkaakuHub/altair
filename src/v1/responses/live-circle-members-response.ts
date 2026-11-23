import { isCircleMember } from '../../state/circle-member-state.ts';
import type { CircleState } from '../../state/circle-types.ts';
import type { JsonObject } from '../../state/json-state-utils.ts';

export function createLiveCircleMembersResponse(
	members: readonly JsonObject[],
	circle: CircleState | null,
	playerId: string,
): JsonObject[] {
	if (circle === null || !isCircleMember(circle, playerId)) return [];
	const memberIds = new Set(circle.members.map((member) => member.playerId));
	return members
		.filter(
			(member) =>
				typeof member.user_player_id === 'string' &&
				memberIds.has(member.user_player_id),
		)
		.map((member) => structuredClone(member));
}
