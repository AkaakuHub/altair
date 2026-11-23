import type {
	RegisteredUserState,
	ServerState,
} from '../../../../../src/server-state-schema.ts';
import {
	deleteCircleState,
	setCircleState,
} from '../../../../../src/state/circle-aggregate-state.ts';
import {
	addCircleJoinRequest,
	approveCircleJoinRequest,
	rejectCircleJoinRequest,
	removeCircleJoinRequest,
} from '../../../../../src/state/circle-join-state.ts';
import {
	addCircleMember,
	changeCircleMemberPosition,
	dismissCircleSubLeader,
	expelCircleMember,
	removeCircleMember,
	transferCircleLeader,
} from '../../../../../src/state/circle-member-state.ts';
import { syncGrandPrixRankingFromRuntime } from '../../../../../src/state/grand-prix-ranking-runtime-sync.ts';
import { findAdminEntryByKey } from '../../state/domain/admin-state-writer.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getFormString,
} from '../shared/admin-form-values.ts';

export function saveCircleFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const leader = findFormUser(
		state,
		getFormString(form, 'circle.leaderPlayerId'),
	);
	if (!leader) {
		return false;
	}
	const guildPolicyAction = getAdminBoundedInteger(
		form,
		'circle.guildPolicyAction',
		0,
		9,
	);
	const guildPolicyRecruiting = getAdminBoundedInteger(
		form,
		'circle.guildPolicyRecruiting',
		0,
		9,
	);
	if (guildPolicyAction === undefined || guildPolicyRecruiting === undefined) {
		return false;
	}
	const isUpdated = setCircleState(state, leader, {
		searchGuildKey: getFormString(form, 'circle.searchGuildKey'),
		guildName: getFormString(form, 'circle.guildName'),
		guildComment: getFormString(form, 'circle.guildComment'),
		guildPolicyAction,
		guildPolicyRecruiting,
		guildIconPartsInfo: getFormString(form, 'circle.guildIconPartsInfo'),
	});
	if (
		isUpdated &&
		(state.grandPrix.guildRanking > 0 || state.grandPrix.guildTotalPoint > 0)
	) {
		syncGrandPrixRankingFromRuntime(state, {
			syncCircle: true,
			syncPersonal: false,
		});
	}
	return isUpdated;
}

export function deleteCircleFromForm(state: ServerState): void {
	deleteCircleState(state);
}

export function addCircleMemberFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const positionType = getAdminBoundedInteger(
		form,
		'circle.positionType',
		0,
		2,
	);
	if (positionType === undefined) {
		return false;
	}
	return addCircleMember(
		state,
		getFormString(form, 'circle.playerId'),
		positionType,
	);
}

export function removeCircleMemberFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return removeCircleMember(state, getFormString(form, 'circle.playerId'));
}

export function addCircleJoinRequestFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return addCircleJoinRequest(
		state,
		getFormString(form, 'circle.playerId'),
		crypto.randomUUID(),
		new Date().toISOString(),
	);
}

export function removeCircleJoinRequestFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return removeCircleJoinRequest(
		state,
		getFormString(form, 'circle.guildInvitationId'),
	);
}

export function approveCircleJoinRequestFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return approveCircleJoinRequest(
		state,
		getFormString(form, 'circle.guildInvitationId'),
	);
}

export function rejectCircleJoinRequestFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return rejectCircleJoinRequest(
		state,
		getFormString(form, 'circle.guildInvitationId'),
	);
}

export function changeCircleMemberPositionFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const positionType = getAdminBoundedInteger(
		form,
		'circle.positionType',
		0,
		2,
	);
	if (positionType === undefined) {
		return false;
	}
	return changeCircleMemberPosition(
		state,
		getFormString(form, 'circle.playerId'),
		positionType,
	);
}

export function dismissCircleSubLeaderFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return dismissCircleSubLeader(state, getFormString(form, 'circle.playerId'));
}

export function expelCircleMemberFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return expelCircleMember(state, getFormString(form, 'circle.playerId'));
}

export function transferCircleLeaderFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	return transferCircleLeader(state, getFormString(form, 'circle.playerId'));
}

function findFormUser(
	state: ServerState,
	playerId: string,
): RegisteredUserState | undefined {
	return findAdminEntryByKey(
		state.registeredUsers,
		playerId,
		(user) => user.playerId,
	);
}
