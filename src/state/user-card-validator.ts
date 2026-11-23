import { isJsonObject, isRecord } from './json-state-utils.ts';
import type { UserCardCollectionState } from './user-card-aggregate-state.ts';
import type { UserCardDataState } from './user-card-types.ts';

export function isUserCardCollectionState(
	value: unknown,
): value is UserCardCollectionState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		Array.isArray(value.userCardDataList) &&
		value.userCardDataList.every(isUserCardDataState)
	);
}

export function isUserCardDataState(
	value: unknown,
): value is UserCardDataState {
	return (
		isJsonObject(value) &&
		(value.source_master_release_id === undefined ||
			typeof value.source_master_release_id === 'string') &&
		(value.identity_fingerprint === undefined ||
			(isRecord(value.identity_fingerprint) &&
				typeof value.identity_fingerprint.domain === 'string' &&
				typeof value.identity_fingerprint.value === 'string')) &&
		typeof value.d_card_datas_id === 'string' &&
		typeof value.card_datas_id === 'number'
	);
}
