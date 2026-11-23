import type { ServerState } from '../server-state-schema.ts';
import { isRecord } from './json-state-utils.ts';

export type UserNotificationState = {
	playerId: string;
	path: string;
	count: number;
	lastNotifiedAt: string;
};

export function recordUserNotification(
	state: ServerState,
	playerId: string,
	path: string,
): void {
	const existing = state.userNotifications.find(
		(notification) =>
			notification.playerId === playerId && notification.path === path,
	);
	const now = new Date().toISOString();
	if (existing) {
		existing.count += 1;
		existing.lastNotifiedAt = now;
		return;
	}
	state.userNotifications = [
		...state.userNotifications,
		{
			playerId,
			path,
			count: 1,
			lastNotifiedAt: now,
		},
	];
}

export function isUserNotificationState(
	value: unknown,
): value is UserNotificationState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		typeof value.path === 'string' &&
		typeof value.count === 'number' &&
		typeof value.lastNotifiedAt === 'string'
	);
}
