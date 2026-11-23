import type { ServerState } from '../server-state-schema.ts';
import { isRecord } from './json-state-utils.ts';

export type UserCircleNotificationState = {
	playerId: string;
	hasDissolutionNotification: boolean;
};

export function markCircleDissolutionNotification(
	state: ServerState,
	playerIds: readonly string[],
): void {
	for (const playerId of playerIds) {
		const notification = ensureUserCircleNotification(state, playerId);
		notification.hasDissolutionNotification = true;
	}
}

export function hasCircleDissolutionNotification(
	state: ServerState,
	playerId: string,
): boolean {
	return (
		state.userCircleNotifications.find(
			(notification) => notification.playerId === playerId,
		)?.hasDissolutionNotification ?? false
	);
}

export function isUserCircleNotificationState(
	value: unknown,
): value is UserCircleNotificationState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		typeof value.hasDissolutionNotification === 'boolean'
	);
}

function ensureUserCircleNotification(
	state: ServerState,
	playerId: string,
): UserCircleNotificationState {
	const existing = state.userCircleNotifications.find(
		(notification) => notification.playerId === playerId,
	);
	if (existing) {
		return existing;
	}
	const notification = {
		playerId,
		hasDissolutionNotification: false,
	};
	state.userCircleNotifications = [
		...state.userCircleNotifications,
		notification,
	];
	return notification;
}
