export type SiscaStoreMaster = {
	itemList: SiscaStoreItemMaster[];
};

export type SiscaStoreItemMaster = {
	siscaStoreDatasId: number;
	itemType: number;
	itemId: number;
	itemNum: number;
	price: number;
	isPaidSiscaOnly: boolean;
	limitNum: number;
};
