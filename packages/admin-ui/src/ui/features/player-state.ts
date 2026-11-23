import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type { AdminRegisteredUser } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';

type PlayerState = {
	playerId: string;
};

export function findPlayerState<T extends PlayerState>(
	entries: readonly T[],
	playerId: string,
): T | undefined {
	return entries.find((entry) => entry.playerId === playerId);
}

export function findSelectedPlayerState<T extends PlayerState>(
	data: AdminStateResponse,
	entries: readonly T[],
): T | undefined {
	return findPlayerState(entries, getSelectedAdminPlayerId(data));
}

export function getSelectedAdminPlayerId(data: AdminStateResponse): string {
	return data.state.selectedAdminPlayerId ?? '';
}

export function findRegisteredUser(
	data: AdminStateResponse,
	playerId: string,
): AdminRegisteredUser | undefined {
	return findPlayerState(data.state.registeredUsers, playerId);
}
