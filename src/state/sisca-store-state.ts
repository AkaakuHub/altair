import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import { isRecord } from './json-state-utils.ts';
import type { SiscaStoreMaster } from './sisca-store-master.ts';

export type SiscaStoreItemState = {
	siscaStoreDatasId: number;
	buyableNum: number;
	isNewItem: boolean;
	isSale: boolean;
};

export type UserSiscaStoreState = {
	playerId: string;
	itemList: SiscaStoreItemState[];
};

export function ensureUserSiscaStore(
	state: Pick<ServerState, 'userSiscaStores'>,
	playerId: string,
	master: SiscaStoreMaster,
): EnsureStateResult<UserSiscaStoreState> {
	const existing = state.userSiscaStores.find(
		(store) => store.playerId === playerId,
	);
	if (existing) {
		return { value: existing, created: false };
	}
	const store = {
		playerId,
		itemList: master.itemList.map((item) => ({
			siscaStoreDatasId: item.siscaStoreDatasId,
			buyableNum: item.limitNum > 0 ? item.limitNum : -1,
			isNewItem: false,
			isSale: true,
		})),
	};
	state.userSiscaStores = [...state.userSiscaStores, store];
	return { value: store, created: true };
}

export function purchaseSiscaStoreItem(
	store: UserSiscaStoreState,
	masterItem: SiscaStoreMaster['itemList'][number],
	purchaseNum: number,
): SiscaStoreItemState | undefined {
	const existing = store.itemList.find(
		(entry) => entry.siscaStoreDatasId === masterItem.siscaStoreDatasId,
	);
	const item = existing ?? {
		siscaStoreDatasId: masterItem.siscaStoreDatasId,
		buyableNum: masterItem.limitNum > 0 ? masterItem.limitNum : -1,
		isNewItem: false,
		isSale: true,
	};
	if (
		purchaseNum <= 0 ||
		item.buyableNum === 0 ||
		(item.buyableNum > 0 && item.buyableNum < purchaseNum)
	) {
		return undefined;
	}
	if (item.buyableNum > 0) {
		item.buyableNum -= purchaseNum;
	}
	item.isNewItem = false;
	if (!existing) {
		store.itemList.push(item);
	}
	return item;
}

export function isUserSiscaStoreState(
	value: unknown,
): value is UserSiscaStoreState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		Array.isArray(value.itemList) &&
		value.itemList.every(isSiscaStoreItemState)
	);
}

function isSiscaStoreItemState(value: unknown): value is SiscaStoreItemState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.siscaStoreDatasId === 'number' &&
		typeof value.buyableNum === 'number' &&
		typeof value.isNewItem === 'boolean' &&
		typeof value.isSale === 'boolean'
	);
}
