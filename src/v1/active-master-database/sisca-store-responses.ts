import type { Database } from 'bun:sqlite';
import { currentUtcIsoDateTime } from '../../master-data/master-time.ts';
import type { SiscaStoreMaster } from '../../state/sisca-store-master.ts';

type SiscaStoreRow = {
	id: number;
	item_type: number;
	item_id: number;
	item_num: number;
	price: number;
	is_paid_sis_ca_only: number;
	limit_num: number;
};

export function getSiscaStoreMasterFromDatabase(
	database: Database,
): SiscaStoreMaster {
	const now = currentUtcIsoDateTime();
	return {
		itemList: database
			.query<SiscaStoreRow, [string, string]>(
				[
					'SELECT id, item_type, item_id, item_num, price, is_paid_sis_ca_only, limit_num',
					'FROM master_sis_ca_store_datas',
					'WHERE datetime(start_time) <= datetime(?)',
					'AND datetime(end_time) > datetime(?)',
					'ORDER BY order_id, id',
				].join(' '),
			)
			.all(now, now)
			.map((row) => ({
				siscaStoreDatasId: row.id,
				itemType: row.item_type,
				itemId: row.item_id,
				itemNum: row.item_num,
				price: row.price,
				isPaidSiscaOnly: row.is_paid_sis_ca_only !== 0,
				limitNum: row.limit_num,
			})),
	};
}
