import type { HomeItemExchangeNewArrival } from '../responses/home-response.ts';

export type HomeExchangeNotifications = Readonly<{
	isNotReadGpPrizeExchangeNewArrival: boolean;
	isNotReadItemExchangeNewArrival: boolean;
	isNotReadOnSaleSelectTicketExchangeNewArrival: boolean;
	isNotReadOutSaleSelectTicketExchangeNewArrival: boolean;
	isNotReadStickerExchangeNewArrival: boolean;
	isNotReadSiscaStoreNewArrival: boolean;
	itemExchangeNewArrivalList: readonly HomeItemExchangeNewArrival[];
}>;

type HomeExchangeNotificationRepository = Readonly<{
	getPendingNotifications: (playerId: string) => HomeExchangeNotifications;
}>;

export const emptyHomeExchangeNotificationRepository: HomeExchangeNotificationRepository =
	{
		getPendingNotifications: () => ({
			isNotReadGpPrizeExchangeNewArrival: false,
			isNotReadItemExchangeNewArrival: false,
			isNotReadOnSaleSelectTicketExchangeNewArrival: false,
			isNotReadOutSaleSelectTicketExchangeNewArrival: false,
			isNotReadStickerExchangeNewArrival: false,
			isNotReadSiscaStoreNewArrival: false,
			itemExchangeNewArrivalList: [],
		}),
	};
