import { randomUUID } from 'node:crypto';
import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import type { EntityProvenance } from './entity-provenance.ts';
import { cloneRecord, isRecord } from './json-state-utils.ts';

type PresentItemDefinition = {
	itemId: number;
	itemType: number;
	name: string;
};

export type PresentBoxItem = {
	comment: string;
	d_present_boxes_id: string;
	error_code: string;
	error_message: string;
	error_title: string;
	exchange_item_data: null;
	get_time: string;
	item_id: number;
	item_type: number;
	life_time_date: null;
	life_time_days: null;
	life_time_type: number;
	live_id: string;
	name: string;
	num: number;
	receipt_limit_time: string | null;
	receipted_time: string | null;
	rewardProvenance?: EntityProvenance;
	withstationPlaybackReward?: true;
};

export type UserPresentBoxState = {
	playerId: string;
	presentList: PresentBoxItem[];
	receivedPresentList: PresentBoxItem[];
};

export function ensureUserPresentBox(
	state: Pick<ServerState, 'userPresentBoxes'>,
	playerId: string,
): EnsureStateResult<UserPresentBoxState> {
	const existing = findUserPresentBox(state, playerId);
	if (existing) {
		return { value: existing, created: false };
	}
	const presentBox = createUserPresentBox(playerId);
	state.userPresentBoxes = [...state.userPresentBoxes, presentBox];
	return { value: presentBox, created: true };
}

export function receivePresentBoxItem(
	presentBox: UserPresentBoxState,
	presentBoxId: string,
): PresentBoxItem | undefined {
	const presentIndex = presentBox.presentList.findIndex(
		(present) => present.d_present_boxes_id === presentBoxId,
	);
	if (presentIndex < 0) {
		return undefined;
	}
	const present = presentBox.presentList[presentIndex];
	if (!present) {
		return undefined;
	}
	const receivedItem = {
		...present,
		receipted_time: new Date().toISOString(),
	};
	presentBox.presentList = presentBox.presentList.filter(
		(_, index) => index !== presentIndex,
	);
	presentBox.receivedPresentList = [
		cloneRecord(receivedItem),
		...presentBox.receivedPresentList,
	];
	return receivedItem;
}

export function receiveAllPresentBoxItems(
	presentBox: UserPresentBoxState,
	shouldReceive: (present: PresentBoxItem) => boolean = () => true,
): PresentBoxItem[] {
	const receiptTime = new Date().toISOString();
	const receivedItems = presentBox.presentList
		.filter(shouldReceive)
		.map((present) => ({
			...present,
			receipted_time: receiptTime,
		}));
	presentBox.receivedPresentList = [
		...receivedItems.map(cloneRecord),
		...presentBox.receivedPresentList,
	];
	presentBox.presentList = presentBox.presentList.filter(
		(present) => !shouldReceive(present),
	);
	return receivedItems.map(cloneRecord);
}

export function deletePresentBoxItem(
	presentBox: UserPresentBoxState,
	presentBoxId: string,
): boolean {
	const originalLength = presentBox.presentList.length;
	presentBox.presentList = presentBox.presentList.filter(
		(present) => present.d_present_boxes_id !== presentBoxId,
	);
	return presentBox.presentList.length !== originalLength;
}

export function addPresentBoxItem(
	presentBox: UserPresentBoxState,
	definition: PresentItemDefinition,
	num: number,
	comment: string,
	receiptLimitTime: string | null,
	liveId: string,
	rewardProvenance: EntityProvenance,
): PresentBoxItem {
	const present = createPresentBoxItem(
		definition,
		num,
		comment,
		receiptLimitTime,
		liveId,
	);
	present.rewardProvenance = rewardProvenance;
	presentBox.presentList = [present, ...presentBox.presentList];
	return cloneRecord(present);
}

export function createPresentBoxItem(
	definition: PresentItemDefinition,
	num: number,
	comment: string,
	receiptLimitTime: string | null,
	liveId: string,
): PresentBoxItem {
	const now = new Date().toISOString();
	const present: PresentBoxItem = {
		comment,
		d_present_boxes_id: randomUUID(),
		error_code: '',
		error_message: '',
		error_title: '',
		exchange_item_data: null,
		get_time: now,
		item_id: definition.itemId,
		item_type: definition.itemType,
		life_time_date: null,
		life_time_days: null,
		life_time_type: 0,
		live_id: liveId,
		name: definition.name,
		num,
		receipt_limit_time: receiptLimitTime,
		receipted_time: null,
	};
	return present;
}

export function isUserPresentBoxState(
	value: unknown,
): value is UserPresentBoxState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		Array.isArray(value.presentList) &&
		value.presentList.every(isPresentBoxItem) &&
		Array.isArray(value.receivedPresentList) &&
		value.receivedPresentList.every(isPresentBoxItem)
	);
}

function findUserPresentBox(
	state: Pick<ServerState, 'userPresentBoxes'>,
	playerId: string,
): UserPresentBoxState | undefined {
	return state.userPresentBoxes.find(
		(presentBox) => presentBox.playerId === playerId,
	);
}

export function createUserPresentBox(playerId: string): UserPresentBoxState {
	return {
		playerId,
		presentList: [],
		receivedPresentList: [],
	};
}

function isPresentBoxItem(value: unknown): value is PresentBoxItem {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.comment === 'string' &&
		typeof value.d_present_boxes_id === 'string' &&
		typeof value.error_code === 'string' &&
		typeof value.error_message === 'string' &&
		typeof value.error_title === 'string' &&
		value.exchange_item_data === null &&
		typeof value.get_time === 'string' &&
		typeof value.item_id === 'number' &&
		typeof value.item_type === 'number' &&
		value.life_time_date === null &&
		value.life_time_days === null &&
		typeof value.life_time_type === 'number' &&
		typeof value.live_id === 'string' &&
		typeof value.name === 'string' &&
		typeof value.num === 'number' &&
		(value.receipt_limit_time === null ||
			typeof value.receipt_limit_time === 'string') &&
		(value.receipted_time === null ||
			typeof value.receipted_time === 'string') &&
		(value.withstationPlaybackReward === undefined ||
			value.withstationPlaybackReward === true) &&
		(value.rewardProvenance === undefined ||
			(isRecord(value.rewardProvenance) &&
				typeof value.rewardProvenance.sourceMasterReleaseId === 'string' &&
				isRecord(value.rewardProvenance.identityFingerprint) &&
				typeof value.rewardProvenance.identityFingerprint.domain === 'string' &&
				typeof value.rewardProvenance.identityFingerprint.value === 'string'))
	);
}
