import { describe, expect, test } from 'bun:test';
import { setVisibleRhythmGameGrandPrixDeckCenter } from '../src/v1/active-master-database/rhythm-game-grand-prix-deck-mutation.ts';

describe('setVisibleRhythmGameGrandPrixDeckCenter', () => {
	test('visible cardだけを更新しhidden canonical cardを保持する', () => {
		const result = setVisibleRhythmGameGrandPrixDeckCenter(
			[
				{
					seriesDeckCardDatasId: 'visible',
					dCardDatasId: 'card-1',
					slotNo: 1,
					isCenter: false,
				},
				{
					seriesDeckCardDatasId: 'hidden',
					dCardDatasId: 'card-2',
					slotNo: 2,
					isCenter: true,
				},
			],
			new Set(['card-1']),
			1,
		);
		expect(result.visible).toEqual([
			{
				seriesDeckCardDatasId: 'visible',
				dCardDatasId: 'card-1',
				slotNo: 1,
				isCenter: true,
			},
		]);
		expect(result.canonical).toContainEqual({
			seriesDeckCardDatasId: 'hidden',
			dCardDatasId: 'card-2',
			slotNo: 2,
			isCenter: true,
		});
	});
});
