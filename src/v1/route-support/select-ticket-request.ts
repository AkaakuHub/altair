import { getNumberField } from './request-fields.ts';

export function readSelectTicketHavingRequest(body: unknown) {
	return {
		exchangeType: getNumberField(body, 'exchange_type'),
		exchangeId: getNumberField(body, 'exchange_id'),
	};
}

export function readSelectTicketExchangeRequest(body: unknown) {
	return {
		selectTicketExchangeRateId: getNumberField(
			body,
			'select_ticket_exchange_rate_id',
		),
	};
}
