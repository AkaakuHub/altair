import { describe, expect, test } from 'bun:test';
import {
	readSelectTicketExchangeRequest,
	readSelectTicketHavingRequest,
} from '../src/v1/route-support/select-ticket-request.ts';

describe('select ticket request', () => {
	test('having list requestのnumber fieldだけを読む', () => {
		expect(
			readSelectTicketHavingRequest({ exchange_type: 2, exchange_id: 10 }),
		).toEqual({ exchangeType: 2, exchangeId: 10 });
		expect(
			readSelectTicketHavingRequest({ exchange_type: '2', exchange_id: null }),
		).toEqual({ exchangeType: undefined, exchangeId: undefined });
	});

	test('exchange rate IDのnumber fieldだけを読む', () => {
		expect(
			readSelectTicketExchangeRequest({ select_ticket_exchange_rate_id: 20 }),
		).toEqual({ selectTicketExchangeRateId: 20 });
		expect(readSelectTicketExchangeRequest(null)).toEqual({
			selectTicketExchangeRateId: undefined,
		});
	});
});
