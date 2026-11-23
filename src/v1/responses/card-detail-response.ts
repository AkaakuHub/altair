import type { UserCardTemplateState } from '../../state/user-card-types.ts';
import type { UserCardDetailResponse } from '../response-types/user-card-deck-response-types.ts';
import { createOfficialUserCardData } from './user-card-response.ts';

export function createCardDetailResponse(
	userCardData: UserCardTemplateState | undefined,
): UserCardDetailResponse | undefined {
	if (!userCardData) {
		return undefined;
	}
	return { user_card_data: createOfficialUserCardData(userCardData) };
}
