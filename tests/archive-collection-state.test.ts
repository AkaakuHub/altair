import { describe, expect, test } from 'bun:test';
import { ensureUserArchiveCollectionState } from '../src/state/archive-collection-aggregate.ts';
import type { CollectionStickerInfo } from '../src/state/sticker-definition.ts';
import {
	addUserSticker,
	createUserStickerInfoList,
} from '../src/state/user-sticker-ownership.ts';
import { applyRawServerStateMigrations } from '../src/state-migrations/raw-server-state-migrations.ts';

describe('archive collection state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userArchiveCollections: [] };
		const first = ensureUserArchiveCollectionState(state, 'player-a');
		const second = ensureUserArchiveCollectionState(state, 'player-a');

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(state.userArchiveCollections).toHaveLength(1);
		expect(first.value.userStickerStates).toEqual([]);
	});

	test('combines user progress with the requested sticker catalog', () => {
		const state = { userArchiveCollections: [] };
		const collection = ensureUserArchiveCollectionState(
			state,
			'player-a',
		).value;
		const currentSticker = createSticker(1, 'current name');
		const provenance = {
			sourceMasterReleaseId: 'release-a',
			identityFingerprint: { domain: 'sticker', value: 'sticker-a' },
		};
		expect(
			addUserSticker(
				collection,
				[currentSticker],
				currentSticker.stickers_id,
				'2026-01-01T00:00:00Z',
				provenance,
			),
		).toBe(true);

		const selectedSticker = createSticker(1, 'selected name');
		expect(
			createUserStickerInfoList(
				collection,
				[selectedSticker],
				() => provenance.identityFingerprint,
			),
		).toEqual([
			{
				...selectedSticker,
				requirement_progress: selectedSticker.requirement_num,
				variant_requirement_progress: selectedSticker.variant_requirement_num,
				is_owned: true,
				is_available_variant: true,
				create_time: '2026-01-01T00:00:00Z',
			},
		]);
	});

	test('keeps same sticker ID ownership independently by identity', () => {
		const collection = ensureUserArchiveCollectionState(
			{ userArchiveCollections: [] },
			'player-a',
		).value;
		const sticker = createSticker(1, 'sticker');
		const oldProvenance = {
			sourceMasterReleaseId: 'old',
			identityFingerprint: { domain: 'sticker', value: 'old' },
		};
		const newProvenance = {
			sourceMasterReleaseId: 'new',
			identityFingerprint: { domain: 'sticker', value: 'new' },
		};

		addUserSticker(collection, [sticker], 1, 'old-time', oldProvenance);
		addUserSticker(collection, [sticker], 1, 'new-time', newProvenance);

		expect(collection.userStickerStates).toHaveLength(2);
		expect(
			createUserStickerInfoList(
				collection,
				[sticker],
				() => newProvenance.identityFingerprint,
			)[0]?.create_time,
		).toBe('new-time');
	});

	test('migrates old sticker catalog copies to user-only state', () => {
		const oldSticker = {
			...createSticker(1, 'old fixed name'),
			requirement_progress: 2,
			variant_requirement_progress: 3,
			is_owned: true,
			is_available_variant: true,
			create_time: '2026-01-01T00:00:00Z',
		};
		const collection = {
			playerId: 'player-a',
			watchedWithliveArchiveIds: [],
			watchedFesArchiveIds: [],
			stickerInfoList: [oldSticker],
		};

		applyRawServerStateMigrations({
			userActivityRecords: [],
			userArchiveCollections: [collection],
		});

		expect(collection).not.toHaveProperty('stickerInfoList');
		expect(collection).toHaveProperty('userStickerStates', [
			{
				stickerId: 1,
				requirementProgress: 2,
				variantRequirementProgress: 3,
				isOwned: true,
				isAvailableVariant: true,
				createTime: '2026-01-01T00:00:00Z',
			},
		]);
	});
});

function createSticker(stickerId: number, name: string): CollectionStickerInfo {
	return {
		stickers_id: stickerId,
		category_type: 1,
		category_name: 1,
		name,
		text: 'text',
		character_id: 1021,
		is_variant: 1,
		season_id: 1,
		requirement_text: 'requirement',
		requirement_num: 4,
		requirement_progress: 0,
		variant_requirement_text: 'variant requirement',
		variant_requirement_num: 5,
		variant_requirement_progress: 0,
		is_owned: false,
		is_available_variant: false,
		create_time: null,
	};
}
