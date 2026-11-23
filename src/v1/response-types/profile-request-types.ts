export type ProfileTargetRequest = { player_id: string };
export type ProfileOptionalTargetRequest = { player_id?: string };
export type ProfileReportRequest = ProfileTargetRequest & {
	report_type: number;
};
export type ProfileCommentRequest = { comment?: string };
export type ProfileNameRequest = { name: string };
export type ProfileDesignSelectionRequest = { d_profile_my_designs_id: string };
export type ProfileIconDesignRequest = ProfileDesignSelectionRequest & {
	profile_icon_parts_info: string;
	my_design_name: string;
};
export type ProfileCardDesignRequest = ProfileDesignSelectionRequest & {
	profile_card_parts_info: string;
	my_design_name: string;
};
export type ProfileFanRankingRequest = { character_id: number };
export type CardDisplayRequest = {
	base_card_series_id: number;
	display_card_id: number;
};
