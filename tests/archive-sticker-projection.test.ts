import { describe, expect, test } from 'bun:test';
import { projectOwnedStickerIds } from '../src/application/archive-sticker-projection.ts';

describe('projectOwnedStickerIds', () => {
	test('request master releaseに存在する所有ステッカーだけを返す', () => {
		expect(
			projectOwnedStickerIds([101, 202, 303], new Set([101, 303])),
		).toEqual([101, 303]);
	});

	test('非対応ステッカーをcanonical所有一覧から削除しない', () => {
		const canonicalOwnedStickerIds = [101, 202];

		projectOwnedStickerIds(canonicalOwnedStickerIds, new Set([101]));

		expect(canonicalOwnedStickerIds).toEqual([101, 202]);
	});
});
