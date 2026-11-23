import { describe, expect, test } from 'bun:test';
import {
	createFollowSearchMissResponse,
	createLiveChatGroupListResponse,
	createMuteListResponse,
} from '../src/v1/responses/social-basic-response.ts';

describe('social basic response', () => {
	test('keeps official empty and mute response shapes', () => {
		expect(createFollowSearchMissResponse()).toEqual({ resultCode: 1 });
		expect(createLiveChatGroupListResponse()).toEqual({
			group_x: [],
			group_y: [],
		});
		expect(
			createMuteListResponse({
				playerId: 'player-1',
				mutePlayerIds: ['player-2'],
				reportApplications: [],
			}),
		).toEqual({ mute_list: [{ player_id: 'player-2' }] });
	});
});
