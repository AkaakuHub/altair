import { expect, test } from 'bun:test';
import {
	ensureWithstationPrizePresent,
	findWithstationPrizePresent,
} from '../../src/application/archive-prize-presents.ts';
import type { ArchivePrizeMaster } from '../../src/state/archive-prize-definition.ts';
import type { EntityProvenance } from '../../src/state/entity-provenance.ts';
import type { UserPresentBoxState } from '../../src/state/user-presents-state.ts';

test('同じWith×STATION IDでもidentityが異なるプレゼントを分離し、同じidentityでは重複作成しない', () => {
	const presentBox: UserPresentBoxState = {
		playerId: 'owner',
		presentList: [],
		receivedPresentList: [],
	};
	const master: ArchivePrizeMaster = {
		liveId: 'withstation',
		title: '配信',
		liveStartTime: '2026-10-28T12:00:00Z',
		characterIds: [1041],
		giftStarRewardSegments: [10000],
		giftStarsThresholdForExtraAdmission: 1,
	};
	const original: EntityProvenance = {
		sourceMasterReleaseId: 'original',
		identityFingerprint: { domain: 'withstation', value: 'original' },
	};
	const replacement: EntityProvenance = {
		sourceMasterReleaseId: 'replacement',
		identityFingerprint: { domain: 'withstation', value: 'replacement' },
	};
	for (const provenance of [original, replacement, original, replacement])
		ensureWithstationPrizePresent(presentBox, master, provenance);
	expect(presentBox.presentList).toHaveLength(2);
	const originalPresent = findWithstationPrizePresent(
		presentBox,
		master.liveId,
		original.identityFingerprint,
	);
	const replacementPresent = findWithstationPrizePresent(
		presentBox,
		master.liveId,
		replacement.identityFingerprint,
	);
	expect(originalPresent?.rewardProvenance).toEqual(original);
	expect(replacementPresent?.rewardProvenance).toEqual(replacement);
	expect(originalPresent?.d_present_boxes_id).not.toBe(
		replacementPresent?.d_present_boxes_id,
	);
});
