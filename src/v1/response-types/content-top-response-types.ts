import type { applyDreamLiveMemberSelect } from '../active-master-database/dream-live-responses.ts';
import type { QuestTopResponse } from '../active-master-database/quest-top-types.ts';
import type { createGiftShopListResponse } from '../route-support/archive-gift-shop.ts';
export type QuestTopWithMembersResponse = ReturnType<
	typeof applyDreamLiveMemberSelect<QuestTopResponse>
>;
export type GiftShopListResponse = ReturnType<
	typeof createGiftShopListResponse
>;
export type WithliveGiftShopListRequest = { m_withlives_id: string };
export type WithstationGiftShopListRequest = { m_withstations_id: string };
