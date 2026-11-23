import { describe, expect, test } from 'bun:test';
import {
	mergeRhythmGameGrandPrixDeckCards,
	projectRhythmGameGrandPrixDeckCards,
} from '../src/application/rhythm-game-grand-prix-deck-projection.ts';
import { resetRhythmGameGrandPrixDecks } from '../src/state/rhythm-game-grand-prix-deck-state.ts';
import {
	readRhythmGameGrandPrixDeckCardList,
	readRhythmGameGrandPrixPositionList,
} from '../src/v1/active-master-database/rhythm-game-grand-prix-deck-request.ts';
import { rhythmGameGrandPrixCardBonusTargets } from '../src/v1/active-master-database/rhythm-game-grand-prix-live-responses.ts';
import { createRhythmGameGrandPrixDeckCardInfoList } from '../src/v1/active-master-database/rhythm-game-grand-prix-response-values.ts';
import {
	rhythmGameGrandPrixRankDisplayType,
	rhythmGameGrandPrixStatus,
} from '../src/v1/active-master-database/rhythm-game-grand-prix-top-response.ts';

describe('rhythm game grand prix responses', () => {
	test('deck response is ordered without mutating canonical state', () => {
		const canonical = [
			{
				seriesDeckCardDatasId: 'series-2',
				dCardDatasId: 'card-2',
				slotNo: 2,
				isCenter: false,
			},
			{
				seriesDeckCardDatasId: 'series-1',
				dCardDatasId: 'card-1',
				slotNo: 1,
				isCenter: true,
			},
		];

		expect(createRhythmGameGrandPrixDeckCardInfoList(canonical)).toEqual([
			{
				series_deck_card_datas_id: 'series-1',
				d_card_datas_id: 'card-1',
				slot_no: 1,
				is_center: true,
			},
			{
				series_deck_card_datas_id: 'series-2',
				d_card_datas_id: 'card-2',
				slot_no: 2,
				is_center: false,
			},
		]);
		expect(canonical.map((card) => card.slotNo)).toEqual([2, 1]);
	});

	test('deck projection retains hidden cards in canonical state', () => {
		const canonical = [
			{
				seriesDeckCardDatasId: 'series-1',
				dCardDatasId: 'card-1',
				slotNo: 1,
				isCenter: true,
			},
			{
				seriesDeckCardDatasId: 'series-2',
				dCardDatasId: 'card-2',
				slotNo: 2,
				isCenter: false,
			},
		];

		expect(
			projectRhythmGameGrandPrixDeckCards(canonical, new Set(['card-1'])),
		).toEqual([
			{
				seriesDeckCardDatasId: 'series-1',
				dCardDatasId: 'card-1',
				slotNo: 1,
				isCenter: true,
			},
		]);
		expect(canonical).toHaveLength(2);
	});

	test('deck update merges visible cards without deleting hidden cards', () => {
		const hidden = {
			seriesDeckCardDatasId: 'hidden-series',
			dCardDatasId: 'new-version-card',
			slotNo: 2,
			isCenter: false,
		};
		const incoming = {
			seriesDeckCardDatasId: 'visible-series',
			dCardDatasId: 'old-version-card',
			slotNo: 1,
			isCenter: true,
		};

		expect(
			mergeRhythmGameGrandPrixDeckCards(
				[hidden],
				[incoming],
				new Set(['old-version-card']),
			),
		).toEqual([incoming, hidden]);
	});

	test('deck reset clears visible cards without deleting hidden cards', () => {
		const hidden = {
			seriesDeckCardDatasId: 'hidden-series',
			dCardDatasId: 'new-version-card',
			slotNo: 2,
			isCenter: false,
		};
		const grandPrix = {
			grandPrixId: 10,
			seriesProgressList: [
				{
					grandPrixRhythmGameSeriesId: 20,
					highScore: 0,
					currentDailyPoint: 0,
					playCount: 0,
					deckCardList: [
						hidden,
						{
							seriesDeckCardDatasId: 'visible-series',
							dCardDatasId: 'old-version-card',
							slotNo: 1,
							isCenter: true,
						},
					],
				},
			],
		};

		resetRhythmGameGrandPrixDecks(grandPrix, new Set(['old-version-card']));

		expect(grandPrix.seriesProgressList[0]?.deckCardList).toEqual([hidden]);
	});

	test('deck update preserves a stable series card id by card or slot', () => {
		const current = [
			{
				seriesDeckCardDatasId: 'same-card',
				dCardDatasId: 'card-1',
				slotNo: 1,
				isCenter: true,
			},
			{
				seriesDeckCardDatasId: 'same-slot',
				dCardDatasId: 'card-2',
				slotNo: 2,
				isCenter: false,
			},
		];
		const generatedIds = ['new-id'];

		const result = readRhythmGameGrandPrixDeckCardList(
			[
				{ slot_no: 3, d_card_datas_id: 'card-1', is_center: false },
				{ slot_no: 2, d_card_datas_id: 'card-3', is_center: true },
				{ slot_no: 4, d_card_datas_id: 'card-4', is_center: false },
			],
			current,
			() => generatedIds.shift() ?? 'unexpected-id',
		);

		expect(result.map((card) => card.seriesDeckCardDatasId)).toEqual([
			'same-slot',
			'same-card',
			'new-id',
		]);
	});

	test('position input ignores entries without a series card id', () => {
		expect(
			readRhythmGameGrandPrixPositionList([
				{ series_deck_card_datas_id: 'series-1', slot_no: 4 },
				{ series_deck_card_datas_id: '', slot_no: 5 },
				undefined,
			]),
		).toEqual(new Map([['series-1', 4]]));
	});

	test('top status and rank display preserve official numeric mapping', () => {
		expect(rhythmGameGrandPrixStatus({ status: 0 })).toBe(4);
		expect(rhythmGameGrandPrixStatus({ status: 1 })).toBe(1);
		expect(rhythmGameGrandPrixStatus({ status: 2 })).toBe(2);
		expect(rhythmGameGrandPrixRankDisplayType(0, 10)).toBe(1);
		expect(rhythmGameGrandPrixRankDisplayType(100, 0)).toBe(2);
		expect(rhythmGameGrandPrixRankDisplayType(100, 10)).toBe(4);
	});

	test('card bonus targets only include cards supported by the session master release', () => {
		const state = {
			userCards: [
				{
					playerId: 'player-1',
					userCardDataList: [
						{
							d_card_datas_id: 'owned-1',
							card_datas_id: 101,
							limit_break_times: 2,
						},
						{
							d_card_datas_id: 'owned-2',
							card_datas_id: 202,
							limit_break_times: 4,
						},
					],
				},
			],
		};

		expect(
			rhythmGameGrandPrixCardBonusTargets(
				state,
				'player-1',
				[
					{
						seriesDeckCardDatasId: 'series-1',
						dCardDatasId: 'owned-1',
						slotNo: 1,
						isCenter: true,
					},
					{
						seriesDeckCardDatasId: 'series-2',
						dCardDatasId: 'owned-2',
						slotNo: 2,
						isCenter: false,
					},
				],
				{
					hasCard: (cardId) => cardId === 101,
					getCardFingerprint: () => undefined,
				},
			),
		).toEqual([{ cardId: 101, limitBreakCount: 2 }]);
	});
});
