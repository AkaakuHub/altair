import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import type { UserSocialState } from './social-types.ts';

export function ensureUserSocialState(
	state: Pick<ServerState, 'userSocials'>,
	playerId: string,
): EnsureStateResult<UserSocialState> {
	const existing = state.userSocials.find(
		(social) => social.playerId === playerId,
	);
	if (existing) return { value: existing, created: false };
	const social = createUserSocialState(playerId);
	state.userSocials = [...state.userSocials, social];
	return { value: social, created: true };
}

export function hasMutedPlayer(
	state: Pick<ServerState, 'userSocials'>,
	playerId: string,
	targetPlayerId: string,
): boolean {
	return (
		state.userSocials
			.find((social) => social.playerId === playerId)
			?.mutePlayerIds.includes(targetPlayerId) ?? false
	);
}

export function hasReportedPlayer(
	state: Pick<ServerState, 'userSocials'>,
	playerId: string,
	targetPlayerId: string,
): boolean {
	return (
		state.userSocials
			.find((social) => social.playerId === playerId)
			?.reportApplications.some(
				(report) => report.playerId === targetPlayerId,
			) ?? false
	);
}

export function setMutedPlayer(
	state: Pick<
		ServerState,
		'followRelations' | 'registeredUsers' | 'userSocials'
	>,
	playerId: string,
	targetPlayerId: string,
): boolean {
	if (
		playerId === targetPlayerId ||
		!hasRegisteredUser(state, playerId) ||
		!hasRegisteredUser(state, targetPlayerId)
	)
		return false;
	const social = ensureUserSocialForMutation(state, playerId);
	if (social.mutePlayerIds.includes(targetPlayerId)) return true;
	social.mutePlayerIds = [...social.mutePlayerIds, targetPlayerId];
	removeFollowRelationState(state, playerId, targetPlayerId);
	return true;
}

export function removeMutedPlayer(
	state: Pick<ServerState, 'registeredUsers' | 'userSocials'>,
	playerId: string,
	targetPlayerId: string,
): boolean {
	if (
		playerId === targetPlayerId ||
		!hasRegisteredUser(state, playerId) ||
		!hasRegisteredUser(state, targetPlayerId)
	)
		return false;
	const social = state.userSocials.find((value) => value.playerId === playerId);
	if (!social) return true;
	social.mutePlayerIds = social.mutePlayerIds.filter(
		(mutePlayerId) => mutePlayerId !== targetPlayerId,
	);
	return true;
}

export function setReportApplication(
	state: Pick<ServerState, 'registeredUsers' | 'userSocials'>,
	playerId: string,
	targetPlayerId: string,
	reportType: number | undefined,
): boolean {
	if (
		playerId === targetPlayerId ||
		reportType === undefined ||
		!Number.isInteger(reportType) ||
		reportType < 1 ||
		!hasRegisteredUser(state, playerId) ||
		!hasRegisteredUser(state, targetPlayerId)
	)
		return false;
	const social = ensureUserSocialForMutation(state, playerId);
	const existing = social.reportApplications.find(
		(report) => report.playerId === targetPlayerId,
	);
	if (existing) {
		existing.reportType = reportType;
		return true;
	}
	social.reportApplications = [
		...social.reportApplications,
		{ playerId: targetPlayerId, reportType },
	];
	return true;
}

export function removeReportApplication(
	state: Pick<ServerState, 'userSocials'>,
	playerId: string,
	targetPlayerId: string,
): boolean {
	const social = state.userSocials.find((value) => value.playerId === playerId);
	if (!social) return false;
	const currentLength = social.reportApplications.length;
	social.reportApplications = social.reportApplications.filter(
		(report) => report.playerId !== targetPlayerId,
	);
	return social.reportApplications.length !== currentLength;
}

function createUserSocialState(playerId: string): UserSocialState {
	return { playerId, mutePlayerIds: [], reportApplications: [] };
}

function ensureUserSocialForMutation(
	state: Pick<ServerState, 'userSocials'>,
	playerId: string,
): UserSocialState {
	const existing = state.userSocials.find(
		(social) => social.playerId === playerId,
	);
	if (existing) return existing;
	const social = createUserSocialState(playerId);
	state.userSocials = [...state.userSocials, social];
	return social;
}

function hasRegisteredUser(
	state: Pick<ServerState, 'registeredUsers'>,
	playerId: string,
): boolean {
	return state.registeredUsers.some((user) => user.playerId === playerId);
}

function removeFollowRelationState(
	state: Pick<ServerState, 'followRelations'>,
	playerId: string,
	targetPlayerId: string,
): void {
	const relationIndex = state.followRelations.findIndex(
		(relation) =>
			relation.playerId === playerId &&
			relation.targetPlayerId === targetPlayerId,
	);
	if (relationIndex !== -1) state.followRelations.splice(relationIndex, 1);
}
