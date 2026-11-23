import { describe, expect, test } from 'bun:test';
import { addActivityRecordFirstWatchPresents } from '../src/application/activity-record-watch-reward-service.ts';
import type { UserPresentBoxState } from '../src/state/user-presents-state.ts';

describe('activity record watch reward service', () => {
	test('後続present定義が欠ける場合は一件も生成しない', () => {
		const presentBox: UserPresentBoxState = {
			playerId: 'player-a',
			presentList: [],
			receivedPresentList: [],
		};
		const rewards = [
			{ watch_reward_type: 3, watch_reward_id: 1, watch_reward_num: 1 },
			{ watch_reward_type: 3, watch_reward_id: 2, watch_reward_num: 1 },
		];

		expect(() =>
			addActivityRecordFirstWatchPresents(
				presentBox,
				rewards,
				(itemId) =>
					itemId === 1 ? { itemId, itemType: 3, name: 'first' } : undefined,
				(itemId) => ({
					sourceMasterReleaseId: 'release-a',
					identityFingerprint: { domain: 'item', value: String(itemId) },
				}),
			),
		).toThrow('activity record watch reward item not found: 2');
		expect(presentBox.presentList).toEqual([]);
	});

	test('全定義とprovenance解決後に全presentを生成する', () => {
		const presentBox: UserPresentBoxState = {
			playerId: 'player-a',
			presentList: [],
			receivedPresentList: [],
		};
		addActivityRecordFirstWatchPresents(
			presentBox,
			[
				{ watch_reward_type: 3, watch_reward_id: 1, watch_reward_num: 2 },
				{ watch_reward_type: 3, watch_reward_id: 2, watch_reward_num: 3 },
			],
			(itemId) => ({ itemId, itemType: 3, name: `item-${itemId}` }),
			(itemId) => ({
				sourceMasterReleaseId: 'release-a',
				identityFingerprint: { domain: 'item', value: String(itemId) },
			}),
		);
		expect(presentBox.presentList.map((present) => present.item_id)).toEqual([
			2, 1,
		]);
	});
});
