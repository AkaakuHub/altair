import { getNumberField, getStringField } from './request-fields.ts';

interface AccountLinkRequest {
	idToken: string;
	platformType: number | undefined;
	provider: number | undefined;
}

interface AccountConnectRequest extends AccountLinkRequest {
	playerId: string;
}

export function readAccountLinkRequest(body: unknown): AccountLinkRequest {
	return {
		idToken: getStringField(body, 'id_token'),
		platformType: getNumberField(body, 'platform_type'),
		provider: getNumberField(body, 'provider'),
	};
}

export function readAccountConnectRequest(
	body: unknown,
): AccountConnectRequest {
	return {
		...readAccountLinkRequest(body),
		playerId: getStringField(body, 'player_id'),
	};
}
