import type { ServerState } from '../../server-state-schema.ts';
import { createProfileIconPartsInfo } from '../responses/profile-icon-parts-response.ts';

const withstationGiftTimelineStyle = {
	nameColor: '#4C7EE5FF',
	textColor: '#3E4346FF',
	backgroundColor: '#F8E443FF',
} as const;

export function createWithstationGiftResponse(
	state: Pick<ServerState, 'userProfileDesigns'>,
	playerId: string,
	timelineId: string,
	userGiftPoint: number,
	totalUserGiftPoint: number,
): {
	timeline_id: string;
	name_color: string;
	text_color: string;
	background_color: string;
	animation: {
		icon_normal_twinkle: boolean;
		icon_strong_twinkle: boolean;
		gift_box_falling: boolean;
	};
	user_gift_pt: number;
	total_user_gift_pt: number;
	user_icon_parts_info: string;
	display_user_icon: boolean;
	image_size: number;
} {
	return {
		timeline_id: timelineId,
		name_color: withstationGiftTimelineStyle.nameColor,
		text_color: withstationGiftTimelineStyle.textColor,
		background_color: withstationGiftTimelineStyle.backgroundColor,
		animation: {
			icon_normal_twinkle: true,
			icon_strong_twinkle: false,
			gift_box_falling: false,
		},
		user_gift_pt: userGiftPoint,
		total_user_gift_pt: totalUserGiftPoint,
		user_icon_parts_info: createProfileIconPartsInfo(state, playerId),
		display_user_icon: true,
		image_size: 0,
	};
}
