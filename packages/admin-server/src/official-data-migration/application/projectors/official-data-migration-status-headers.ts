import type { UserStatusState } from '../../../../../../src/state/user-status-types.ts';
import type { OfficialApiDumpEvent } from '../official-data-migration-dump.ts';
import {
	parseJsonRecord,
	readNumber,
	readStringNumber,
} from '../official-data-migration-dump.ts';

export function applyStatusHeadersFromEvents(
	status: UserStatusState,
	events: readonly OfficialApiDumpEvent[],
): boolean {
	const headers = findStatusHeaders(events);
	if (headers === null) {
		return false;
	}
	let applied = false;
	applied =
		setNumberHeader(headers, 'jewel_free', (value) => {
			status.jewelFree = value;
		}) || applied;
	applied =
		setNumberHeader(headers, 'jewel_paid_apple', (value) => {
			status.jewelPaidApple = value;
		}) || applied;
	applied =
		setNumberHeader(headers, 'jewel_paid_google', (value) => {
			status.jewelPaidGoogle = value;
		}) || applied;
	applied =
		setUserStaminaHeader(status, headers.get('user_stamina')) || applied;
	return applied;
}

function findStatusHeaders(
	events: readonly OfficialApiDumpEvent[],
): ReadonlyMap<string, string> | null {
	for (const event of [...events].reverse()) {
		if (
			event.statusCode !== null &&
			(event.statusCode < 200 || event.statusCode >= 400)
		) {
			continue;
		}
		if (event.headers.has('jewel_free') || event.headers.has('user_stamina')) {
			return event.headers;
		}
	}
	return null;
}

function setNumberHeader(
	headers: ReadonlyMap<string, string>,
	name: string,
	setValue: (value: number) => void,
): boolean {
	const value = readStringNumber(headers.get(name));
	if (value === null) {
		return false;
	}
	setValue(value);
	return true;
}

function setUserStaminaHeader(
	status: UserStatusState,
	value: string | undefined,
): boolean {
	if (value === undefined) {
		return false;
	}
	const parsed = parseJsonRecord(value);
	if (parsed === null) {
		return false;
	}
	const staminaNow = readNumber(parsed.stamina_now);
	const staminaMax = readNumber(parsed.stamina_max);
	const staminaRecoveryTime = parsed.stamina_recovery_time;
	if (staminaNow !== null) {
		status.staminaNow = staminaNow;
	}
	if (staminaMax !== null) {
		status.staminaMax = staminaMax;
	}
	if (typeof staminaRecoveryTime === 'string') {
		status.staminaRecoveryTime = staminaRecoveryTime;
	}
	return (
		staminaNow !== null ||
		staminaMax !== null ||
		typeof staminaRecoveryTime === 'string'
	);
}
