import { describe, expect, test } from 'bun:test';
import {
	appendCircleChatLog,
	getLatestCircleChatOrderId,
} from '../src/state/circle-chat-state.ts';
import { isCircleState } from '../src/state/circle-state-validator.ts';
import type { CircleState } from '../src/state/circle-types.ts';

describe('circle state', () => {
	test('appends chat after the largest persisted order ID', () => {
		const circle = createCircle();
		circle.chatLogs = [
			{
				chatDataId: 'newer',
				chatType: 1,
				playerId: 'player',
				comment: 'newer',
				orderId: 5,
				createTime: '2026-07-11T00:00:00Z',
			},
			{
				chatDataId: 'older',
				chatType: 1,
				playerId: 'player',
				comment: 'older',
				orderId: 2,
				createTime: '2026-07-10T00:00:00Z',
			},
		];

		const appended = appendCircleChatLog(
			circle,
			'player',
			'latest',
			'2026-07-12T00:00:00Z',
		);

		expect(appended.orderId).toBe(6);
		expect(circle.chatLogs[0]).toBe(appended);
		expect(getLatestCircleChatOrderId(circle)).toBe(6);
	});

	test('validates the complete aggregate shape', () => {
		const circle = createCircle();
		expect(isCircleState(circle)).toBe(true);
		expect(isCircleState({ ...circle, joinRequests: [{}] })).toBe(false);
	});
});

function createCircle(): CircleState {
	return {
		searchGuildKey: 'SEARCHKEY',
		guildId: 'guild',
		chatRoomId: 'chat-room',
		guildName: 'circle',
		leaderPlayerId: 'player',
		guildRank: 1,
		guildPolicyAction: 1,
		guildPolicyRecruiting: 1,
		guildComment: 'comment',
		guildIconPartsInfo: '{}',
		members: [{ playerId: 'player', positionType: 1 }],
		chatLogs: [],
		joinRequests: [],
	};
}
