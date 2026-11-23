import { describe, expect, test } from 'bun:test';
import { questLiveConsumptionKind } from '../src/v1/route-support/quest-live-consumption-kind.ts';

describe('quest live consumption kind', () => {
	test('daily questだけticketを使用する', () => {
		expect(questLiveConsumptionKind(2)).toBe('dailyTicket');
		expect(questLiveConsumptionKind(1)).toBe('playPoint');
		expect(questLiveConsumptionKind(6)).toBe('playPoint');
	});
});
