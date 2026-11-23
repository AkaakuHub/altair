import {
	getArchiveId,
	getNumberField,
	getStringField,
} from './request-fields.ts';

export const readArchiveDetailId = (body: unknown, field: string) =>
	getStringField(body, field);

export function readArchiveWithliveRequest(body: unknown) {
	return { archiveId: getArchiveId(body) };
}

export function readArchiveRankingRequest(body: unknown): {
	targetPeriod: 'current' | 'previous';
	memberId: number;
} {
	const targetPeriod = getStringField(body, 'target_period');
	if (targetPeriod !== 'current' && targetPeriod !== 'previous') {
		throw new Error('target_period must be current or previous');
	}
	return {
		targetPeriod,
		memberId: getNumberField(body, 'member_id') ?? 0,
	};
}

export function readArchiveGiftRequest(body: unknown) {
	return {
		liveId: getStringField(body, 'live_id'),
		userItemId: getStringField(body, 'user_item_id'),
		useOwnAmount: getNumberField(body, 'use_own_amount') ?? 0,
	};
}

export function readArchiveStarsRequest(body: unknown) {
	return {
		presentBoxId: getStringField(body, 'present_box_id'),
		setStarJson: getStringField(body, 'set_star_json'),
	};
}
