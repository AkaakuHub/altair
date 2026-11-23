import type { UseSeasonFanLevelPointStock } from '../../state/season-fan-level-point-stock.ts';
import { isJsonRecord } from './request-fields.ts';

export function readUseSeasonFanLevelPointStockList(
	body: unknown,
): UseSeasonFanLevelPointStock[] | undefined {
	if (!isJsonRecord(body) || !Array.isArray(body.use_stock_list)) {
		return undefined;
	}
	const useStockList: UseSeasonFanLevelPointStock[] = [];
	for (const value of body.use_stock_list) {
		if (!isJsonRecord(value)) {
			return undefined;
		}
		const charactersId = value.characters_id;
		const useStock = value.use_stock;
		if (typeof charactersId !== 'number' || typeof useStock !== 'number') {
			return undefined;
		}
		useStockList.push({ charactersId, useStock });
	}
	return useStockList;
}
