type MessageCardResponseInput = {
	timelineId: string;
	message: string;
	nameColor: string;
	textColor: string;
	backgroundColor: string;
	textSize: number;
	isTextBold: boolean;
};

export function createWithstationMessageCardResponse(
	input: MessageCardResponseInput,
) {
	return {
		timeline_id: input.timelineId,
		name_color: input.nameColor,
		text_color: input.textColor,
		background_color: input.backgroundColor,
		user_gift_pt: 0,
		total_user_gift_pt: 0,
		message: input.message,
		text_size: input.textSize,
		is_text_bold: input.isTextBold,
	};
}
