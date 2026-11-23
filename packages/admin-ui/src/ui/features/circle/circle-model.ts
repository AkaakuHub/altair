import type {
	AdminCircle,
	AdminCircleMember,
	AdminRegisteredUser,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { AdminFormValues } from '../../../form-value.ts';
import { findPlayerState } from '../player-state.ts';

export type CircleForm = {
	leaderPlayerId: string;
	searchGuildKey: string;
	guildName: string;
	guildComment: string;
	guildPolicyAction: string;
	guildPolicyRecruiting: string;
	guildIconPartsInfo: string;
};

export type CircleMemberForm = {
	playerId: string;
	positionType: number;
};

export type JoinRequestForm = {
	playerId: string;
};

type PositionLabels = Readonly<{
	member: string;
	leader: string;
	subleader: string;
}>;

type MemberRow = {
	playerId: string;
	playerName: string;
	positionType: number;
	positionLabel: string;
};

type JoinRequestRow = {
	guildInvitationId: string;
	playerId: string;
	playerName: string;
	createTime: string;
};

export function createCircleForm(
	circle: AdminCircle | null | undefined,
	selectedAdminPlayerId: string,
): CircleForm {
	return {
		leaderPlayerId: circle?.leaderPlayerId ?? selectedAdminPlayerId,
		searchGuildKey: circle?.searchGuildKey ?? '',
		guildName: circle?.guildName ?? '',
		guildComment: circle?.guildComment ?? '',
		guildPolicyAction: String(circle?.guildPolicyAction ?? 1),
		guildPolicyRecruiting: String(circle?.guildPolicyRecruiting ?? 1),
		guildIconPartsInfo: circle?.guildIconPartsInfo ?? '',
	};
}

export function createCircleMemberForm(
	circle: Pick<AdminCircle, 'members'> | null | undefined,
	playerId: string,
): CircleMemberForm {
	return {
		playerId,
		positionType:
			circle?.members.find((member) => member.playerId === playerId)
				?.positionType ?? 0,
	};
}

export function createJoinRequestForm(playerId: string): JoinRequestForm {
	return {
		playerId,
	};
}

export function memberFormValues(
	playerId: string,
	positionType: number,
): AdminFormValues {
	return {
		'circle.playerId': playerId,
		'circle.positionType': positionType,
	};
}

export function joinRequestFormValues(form: JoinRequestForm): AdminFormValues {
	return { 'circle.playerId': form.playerId };
}

export function memberPlayerFormValues(playerId: string): AdminFormValues {
	return { 'circle.playerId': playerId };
}

export function joinRequestIdFormValues(
	guildInvitationId: string,
): AdminFormValues {
	return { 'circle.guildInvitationId': guildInvitationId };
}

export function circleFormValues(circle: CircleForm): AdminFormValues {
	return {
		'circle.searchGuildKey': circle.searchGuildKey,
		'circle.leaderPlayerId': circle.leaderPlayerId,
		'circle.guildName': circle.guildName,
		'circle.guildComment': circle.guildComment,
		'circle.guildPolicyAction': Number(circle.guildPolicyAction),
		'circle.guildPolicyRecruiting': Number(circle.guildPolicyRecruiting),
		'circle.guildIconPartsInfo': circle.guildIconPartsInfo,
	};
}

export function createMemberRows(
	circle: Pick<AdminCircle, 'members'> | null | undefined,
	users: AdminRegisteredUser[],
	labels: PositionLabels,
): MemberRow[] {
	if (!circle) {
		return [];
	}
	return circle.members.map((member) => {
		const user = findPlayerState(users, member.playerId);
		return {
			playerId: member.playerId,
			playerName: user?.playerName ?? member.playerId,
			positionType: member.positionType,
			positionLabel: formatMemberPosition(member, labels),
		};
	});
}

export function createJoinRequestRows(
	circle: AdminCircle | null | undefined,
	users: AdminRegisteredUser[],
): JoinRequestRow[] {
	if (!circle) {
		return [];
	}
	return circle.joinRequests.map((joinRequest) => {
		const user = findPlayerState(users, joinRequest.playerId);
		return {
			guildInvitationId: joinRequest.guildInvitationId,
			playerId: joinRequest.playerId,
			playerName: user?.playerName ?? joinRequest.playerId,
			createTime: joinRequest.createTime,
		};
	});
}

export function filterCircleMembers(
	members: MemberRow[],
	query: string,
): MemberRow[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return members;
	}
	return members.filter((member) =>
		`${member.playerId} ${member.playerName} ${member.positionType} ${member.positionLabel}`
			.toLowerCase()
			.includes(normalized),
	);
}

export function filterJoinRequests(
	joinRequests: JoinRequestRow[],
	query: string,
): JoinRequestRow[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return joinRequests;
	}
	return joinRequests.filter((joinRequest) =>
		`${joinRequest.guildInvitationId} ${joinRequest.playerId} ${joinRequest.playerName} ${joinRequest.createTime}`
			.toLowerCase()
			.includes(normalized),
	);
}

export function filterChatLogs<ChatLog extends object>(
	chatLogs: ChatLog[],
	query: string,
): ChatLog[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return chatLogs;
	}
	return chatLogs.filter((chatLog) =>
		Object.values(chatLog).join(' ').toLowerCase().includes(normalized),
	);
}

function formatMemberPosition(
	member: AdminCircleMember,
	labels: PositionLabels,
): string {
	switch (member.positionType) {
		case 0:
			return labels.member;
		case 1:
			return labels.leader;
		case 2:
			return labels.subleader;
		default:
			return String(member.positionType);
	}
}
