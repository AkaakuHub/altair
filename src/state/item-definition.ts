export type ItemCatalogEntry = {
	itemId: number;
	itemType: number;
	itemCategory: number;
	rarity: number;
	name: string;
	limitNum: number;
	requestableNum: number;
	resourceFileName: string;
	limitDateTime: string | null;
};
