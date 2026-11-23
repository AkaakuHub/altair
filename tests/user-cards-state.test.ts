import { describe, expect, test } from 'bun:test';
import {
	ensureUserCards,
	type UserCardCollectionState,
} from '../src/state/user-card-aggregate-state.ts';
import { isUserCardDataState } from '../src/state/user-card-validator.ts';

describe('ensureUserCards', () => {
	test('カードstateがない場合はseedから作成したことを返す', () => {
		const state: { userCards: UserCardCollectionState[] } = { userCards: [] };

		const result = ensureUserCards(state, 'player-1', {
			user_card_data_list: [],
		});

		expect(result.created).toBe(true);
		expect(result.value).toEqual({
			playerId: 'player-1',
			userCardDataList: [],
		});
		expect(state.userCards).toEqual([result.value]);
	});

	test('カードstateがある場合は既存stateを返して変更しない', () => {
		const cards = { playerId: 'player-1', userCardDataList: [] };
		const state = { userCards: [cards] };

		const result = ensureUserCards(state, 'player-1', [{ ignored: true }]);

		expect(result).toEqual({ value: cards, created: false });
		expect(state.userCards).toEqual([cards]);
	});
});

describe('isUserCardDataState', () => {
	test('provenanceとidentity fingerprintを持つcanonical cardを受理する', () => {
		expect(
			isUserCardDataState({
				d_card_datas_id: 'owned-card',
				card_datas_id: 102180341,
				source_master_release_id: 'release-1',
				identity_fingerprint: {
					domain: 'card',
					value: 'fingerprint-1',
				},
			}),
		).toBe(true);
	});

	test('不完全なidentity fingerprintを拒否する', () => {
		expect(
			isUserCardDataState({
				d_card_datas_id: 'owned-card',
				card_datas_id: 102180341,
				identity_fingerprint: { domain: 'card' },
			}),
		).toBe(false);
	});
});
