export type UserSocialState = {
	playerId: string;
	mutePlayerIds: string[];
	reportApplications: UserReportApplicationState[];
};

export type UserReportApplicationState = {
	playerId: string;
	reportType: number;
};
