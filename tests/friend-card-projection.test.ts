import { describe, expect, test } from 'bun:test';
import {
	isFriendCardVisible,
	projectFriendCardInfo,
} from '../src/application/friend-card-projection.ts';
import type { UserCardDataState } from '../src/state/user-card-types.ts';

describe('friend card projection', () => {
	test('request master releaseに定義がないfriend cardを表示しない', () => {
		const card = {
			card_datas_id: 20,
			d_card_datas_id: 'card-20',
		} as UserCardDataState;
		expect(
			isFriendCardVisible(card, {
				hasCard: (id) => id === 10,
				getCardFingerprint: () => undefined,
			}),
		).toBe(false);
		expect(
			isFriendCardVisible(card, {
				hasCard: (id) => id === 20,
				getCardFingerprint: () => undefined,
			}),
		).toBe(true);
	});

	test('非対応cardをresponseだけから除外しcanonical入力を変更しない', () => {
		const entries = [
			{
				card_type: 1,
				user_card_info: {
					card_datas_id: 10,
					d_card_datas_id: 'card-10',
					source_master_release_id: 'release-a',
					identity_fingerprint: { domain: 'card', value: 'card-10' },
				} as UserCardDataState,
			},
			{
				card_type: 2,
				user_card_info: {
					card_datas_id: 20,
					d_card_datas_id: 'card-20',
				} as UserCardDataState,
			},
		];
		const canonical = structuredClone(entries);

		const projected = projectFriendCardInfo(entries, {
			hasCard: (cardDatasId) => cardDatasId === 10,
			getCardFingerprint: () => ({ domain: 'card', value: 'card-10' }),
		});

		expect(projected).toHaveLength(1);
		expect(projected[0]?.user_card_info.card_datas_id).toBe(10);
		expect(projected[0]?.user_card_info).not.toHaveProperty(
			'source_master_release_id',
		);
		expect(projected[0]?.user_card_info).not.toHaveProperty(
			'identity_fingerprint',
		);
		expect(projected[0]).not.toBe(entries[0]);
		expect(entries).toEqual(canonical);
	});

	test('同じIDでもmaster release間でidentityが異なるcardを表示しない', () => {
		const card = {
			card_datas_id: 10,
			d_card_datas_id: 'card-10',
			identity_fingerprint: { domain: 'card', value: 'canonical' },
		} as UserCardDataState;

		expect(
			isFriendCardVisible(card, {
				hasCard: () => true,
				getCardFingerprint: () => ({ domain: 'card', value: 'target' }),
			}),
		).toBe(false);
	});
});
