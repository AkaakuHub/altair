import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import type {
	GachaExchangeCardState,
	GachaGuaranteeExchangeItemState,
} from './gacha-guarantee-types.ts';
import type { GachaPurchasePlanState } from './gacha-purchase-state.ts';
import type { JsonObject } from './json-state-utils.ts';

export type GachaSeriesProgressState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	gachaSeriesId: number;
	userExchangePointNum: number;
	userSeriesExecCount: number;
};

export type GachaHistoryEntryFields = {
	gacha_date_time: string;
	gacha_price_num: number;
	gacha_price_type: number;
	gacha_series_id: number;
	gacha_result_history_info_list: {
		card_datas_id: number;
		gacha_bonus_result_history_list: JsonObject[];
		order_id: number;
	}[];
};
export type GachaHistoryEntryState = JsonObject &
	Partial<GachaHistoryEntryFields>;

export type GachaPaidOnlyPurchaseState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	gachaSeriesId: number;
	gameDate: string;
};

export type GachaSeriesProvenance = EntityProvenance;

export type UserGachaState = {
	playerId: string;
	seriesProgressList: GachaSeriesProgressState[];
	resultHistoryList: GachaHistoryEntryState[];
	guaranteeExchangeItemList: GachaGuaranteeExchangeItemState[];
	exchangeCardList: GachaExchangeCardState[];
	purchasePlans: GachaPurchasePlanState[];
	paidOnlyPurchaseList: GachaPaidOnlyPurchaseState[];
	guaranteeExchangeMasterReleaseId?: string;
	selectTicketExchangeMasterReleaseId?: string;
};

export type GachaPurchaseResult = {
	resultList: JsonObject[];
	gachaExchangePointId: number;
	userGuaranteePointNumBefore: number;
	userGuaranteePointNumAfter: number;
	bonusResultList: JsonObject[];
};
