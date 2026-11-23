import { describe, expect, test } from 'bun:test';
import type { CircleState } from '../src/state/circle-types.ts';
import { selectCircleChatLogs } from '../src/v1/responses/circle-chat-response.ts';
import { matchesCircleSearchConditions } from '../src/v1/responses/circle-directory-response.ts';

const circle: CircleState = {
	searchGuildKey: 'circle-key',
	guildId: 'circle-id',
	chatRoomId: 'chat-room',
	guildName: 'Sample Circle',
	leaderPlayerId: 'player-1',
	guildRank: 1,
	guildPolicyAction: 2,
	guildPolicyRecruiting: 3,
	guildComment: '',
	guildIconPartsInfo: '',
	members: [
		{ playerId: 'player-1', positionType: 1 },
		{ playerId: 'player-2', positionType: 2 },
	],
	chatLogs: [
		{
			chatDataId: 'chat-1',
			chatType: 1,
			playerId: 'player-1',
			comment: 'first',
			orderId: 10,
			createTime: null,
		},
		{
			chatDataId: 'chat-2',
			chatType: 1,
			playerId: 'player-2',
			comment: 'second',
			orderId: 11,
			createTime: null,
		},
	],
	joinRequests: [],
};

describe('circle search response selection', () => {
	test('名前は大文字小文字を区別せず、人数と方針は完全一致で選ぶ', () => {
		expect(
			matchesCircleSearchConditions(circle, {
				guildName: 'circle',
				guildMemberNum: 2,
				guildPolicyAction: 2,
				guildPolicyRecruiting: 3,
				pageNum: 1,
			}),
		).toBe(true);
	});

	test('人数が異なるcircleを除外する', () => {
		expect(
			matchesCircleSearchConditions(circle, {
				guildName: '',
				guildMemberNum: 1,
				guildPolicyAction: null,
				guildPolicyRecruiting: null,
				pageNum: 1,
			}),
		).toBe(false);
	});
});

describe('circle chat response selection', () => {
	test('diff order idより後のlogだけを選ぶ', () => {
		expect(selectCircleChatLogs(circle, { diffOrderId: 10 })).toEqual(
			circle.chatLogs.slice(1),
		);
	});

	test('diff order idがない場合は全logを返す', () => {
		expect(selectCircleChatLogs(circle, { diffOrderId: null })).toEqual(
			circle.chatLogs,
		);
	});
});
