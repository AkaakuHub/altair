import { describe, expect, test } from 'bun:test';
import {
	getActiveGachaHeaderState,
	getActiveGachaSeriesAdminSummary,
} from '../src/application/gacha-availability-service.ts';

const seriesList = [
	{ gachaSeriesId: 1, isPartyGacha: false },
	{ gachaSeriesId: 2, isPartyGacha: true },
];

describe('gacha availability service', () => {
	test('combines selected master series with runtime activations', () => {
		const activations = [
			{ gachaSeriesId: 1, isEnabled: false },
			{ gachaSeriesId: 2, isEnabled: true },
		];

		expect(getActiveGachaSeriesAdminSummary(seriesList, activations)).toEqual([
			{ gachaSeriesId: 2, isPartyGacha: true },
		]);
		expect(getActiveGachaHeaderState(seriesList, activations)).toEqual({
			hasActiveGacha: true,
			hasPartyGacha: true,
			newGachaUnreadableType: 2,
		});
	});
});
