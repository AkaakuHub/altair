import type { ServerState } from '../../server-state-schema.ts';
import type { GiftPointRankingsResponse } from '../response-types/live-broadcast-response-types.ts';
import { createProfileIconPartsInfo } from './profile-icon-parts-response.ts';

export function createUserGiftPointRankingsResponse(
	points: readonly { playerId: string; totalGiftPoint: number }[],
	playerId: string,
	state: Pick<ServerState, 'registeredUsers' | 'userProfileDesigns'>,
	totalGiftPoint: string,
	pollingInterval: number,
): GiftPointRankingsResponse {
	const users = new Map(
		state.registeredUsers.map((user) => [user.playerId, user]),
	);
	const rankings = points
		.toSorted((left, right) => right.totalGiftPoint - left.totalGiftPoint)
		.map((point, index) => {
			const user = users.get(point.playerId);
			if (user === undefined)
				throw new Error(`ranked user is missing: ${point.playerId}`);
			return {
				user_id: point.playerId,
				user_name: user.playerName,
				user_icon_parts_info: createProfileIconPartsInfo(state, point.playerId),
				ranking: index + 1,
				gift_pt: point.totalGiftPoint,
			};
		});
	return {
		gift_pt_rankings: rankings,
		user_gift_pt:
			points.find((point) => point.playerId === playerId)?.totalGiftPoint ?? 0,
		user_gift_pt_ranking:
			rankings.find((row) => row.user_id === playerId)?.ranking ?? 0,
		user_icon_parts_info: createProfileIconPartsInfo(state, playerId),
		total_gift_pt: totalGiftPoint,
		polling_interval: pollingInterval,
	};
}
