import { describe, expect, test } from 'bun:test';
import {
	addPresentBoxItem,
	ensureUserPresentBox,
} from '../src/state/user-presents-state.ts';
import { createPresentBoxListResponse } from '../src/v1/responses/present-box-response.ts';

describe('user presents state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userPresentBoxes: [] };

		const first = ensureUserPresentBox(state, 'player-a');
		const second = ensureUserPresentBox(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(first.value.presentList).toEqual([]);
		expect(first.value.receivedPresentList).toEqual([]);
	});

	test('生成元provenanceをstateに保持して公式responseから除外する', () => {
		const presentBox = ensureUserPresentBox(
			{ userPresentBoxes: [] },
			'player-a',
		).value;
		const rewardProvenance = {
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: { domain: 'item', value: '[1,3,4]' },
		};
		const present = addPresentBoxItem(
			presentBox,
			{ itemId: 1, itemType: 3, name: 'item' },
			2,
			'comment',
			null,
			'',
			rewardProvenance,
		);

		expect(present.rewardProvenance).toEqual(rewardProvenance);
		expect(
			createPresentBoxListResponse(presentBox, 1).items?.[0],
		).not.toHaveProperty('rewardProvenance');
	});
});
