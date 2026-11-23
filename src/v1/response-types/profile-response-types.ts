import type { ProfileDesignEntry } from '../../state/profile-design-state.ts';

export type ProfileDesignListResponse = {
	my_design_list: ProfileDesignEntry[];
};
export type CardDisplayResponse = {
	base_card_series_id: number;
	before_display_card_id: number;
	after_display_card_id: number;
};
