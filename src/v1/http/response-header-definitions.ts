export const stateHeaderValue = placeholder('STATE_HEADER');
export const dateGmtPlaceholder = placeholder('DATE_GMT');
export const resourceVersionPlaceholder = placeholder('RES_VERSION');
const standardResponseHeaders = [
	['content-type', 'application/json; charset=UTF-8'],
	['x-res-version', resourceVersionPlaceholder],
	['x-server-date', dateGmtPlaceholder],
	['date', dateGmtPlaceholder],
	['server', 'Google Frontend'],
	['Transfer-Encoding', 'chunked'],
] as const;
const defaultStateHeaderNames = [
	'achieved_mission_notification_list',
	'chapter_rank_id',
	'chapter_total_point',
	'exists_circle_approval_pending_from_user',
	'fan_level',
	'is_already_read_friend_request',
	'is_already_read_item_store_new_arrival',
	'is_already_read_membership_new_arrival',
	'is_already_read_petal_exchange_new_arrival',
	'is_already_read_shop_new_arrival',
	'is_already_read_sisca_shop_new_arrival',
	'is_circle_approve_user',
	'is_circle_dissolution_user',
	'is_circle_invite_user',
	'is_grand_prix_open',
	'is_party_gacha_underway',
	'jewel_free',
	'jewel_paid_apple',
	'jewel_paid_google',
	'latest_chat_order_id',
	'launcher_info',
	'name',
	'new_gacha_unreadable_type',
	'presentbox_count',
	'user_stamina',
] as const;

export function createStandardResponseHeaders(): ReadonlyArray<
	readonly [string, string]
> {
	return standardResponseHeaders;
}

export function createDefaultResponseHeaders(): ReadonlyArray<
	readonly [string, string]
> {
	return [
		...defaultStateHeaderNames.map((name) => [name, stateHeaderValue] as const),
		...standardResponseHeaders,
	];
}

function placeholder(name: string): string {
	return `\${${name}}`;
}
