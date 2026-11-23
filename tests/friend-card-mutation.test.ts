import { describe, expect, test } from 'bun:test';
import { createFriendCardInfo } from '../src/state/friend-card-profile-projection.ts';
import { mergeFriendCardReference } from '../src/state/friend-card-reference-state.ts';

describe('friend card mutation', () => {
	test('空requestではhidden参照を保持し、visible参照を解除する', () => {
		const visible = new Set(['visible-card']);

		expect(mergeFriendCardReference('', 'hidden-card', visible)).toBe(
			'hidden-card',
		);
		expect(mergeFriendCardReference('', 'visible-card', visible)).toBe('');
		expect(
			mergeFriendCardReference('visible-card', 'hidden-card', visible),
		).toBe('visible-card');
		expect(
			mergeFriendCardReference('unsupported-card', '', visible),
		).toBeUndefined();
	});

	test('profile用friend cardからcanonical provenanceを除外する', () => {
		const response = createFriendCardInfo(
			{
				userFriendCards: [
					{
						playerId: 'player-a',
						schoolIdolStageCardId: 'owned-card',
						rhythmGameCardId: '',
					},
				],
			},
			{
				playerId: 'player-a',
				userCardDataList: [
					{
						d_card_datas_id: 'owned-card',
						card_datas_id: 1001,
						source_master_release_id: 'release-a',
						identity_fingerprint: { domain: 'card', value: 'card-1001' },
					},
				],
			},
			'player-a',
		);

		expect(response[0]?.user_card_info).not.toHaveProperty(
			'source_master_release_id',
		);
		expect(response[0]?.user_card_info).not.toHaveProperty(
			'identity_fingerprint',
		);
	});
});
