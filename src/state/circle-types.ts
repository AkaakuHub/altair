export type CircleMemberState = {
	playerId: string;
	positionType: number;
	playerName?: string;
	playerLevel?: number;
	userType?: number;
	profileCardPartsInfo?: string;
	profileIconPartsInfo?: string;
	isMutePlayer?: boolean;
	isVoiceChatBan?: boolean;
	lastLoginDateTime?: string;
};

export type CircleChatLogState = {
	chatDataId: string;
	chatType: number;
	playerId: string;
	comment: string;
	orderId: number;
	createTime: string | null;
};

export type CircleJoinRequestState = {
	guildInvitationId: string;
	playerId: string;
	createTime: string;
};

export type CircleState = {
	searchGuildKey: string;
	guildId: string;
	chatRoomId: string;
	guildName: string;
	leaderPlayerId: string;
	guildRank: number;
	guildPolicyAction: number;
	guildPolicyRecruiting: number;
	guildComment: string;
	guildIconPartsInfo: string;
	members: CircleMemberState[];
	chatLogs: CircleChatLogState[];
	joinRequests: CircleJoinRequestState[];
};

export type CircleCreateInput = {
	searchGuildKey: string;
	guildName: string;
	guildComment: string;
	guildPolicyAction: number;
	guildPolicyRecruiting: number;
	guildIconPartsInfo: string;
};

export type CircleCreateApiInput = {
	guildName: string;
	guildComment: string;
	guildPolicyAction: number;
	guildPolicyRecruiting: number;
	guildIconPartsInfo: string;
};

export type CircleSettingApiInput = CircleCreateApiInput & {
	searchGuildKey: string;
};
