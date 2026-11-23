import { describe, expect, test } from 'bun:test';
import { createWithstationMessageCardResponse } from '../src/v1/responses/withstation-response.ts';

describe('withstation response', () => {
	test('message cardの公式response形状を構築する', () => {
		expect(
			createWithstationMessageCardResponse({
				timelineId: 'timeline-a',
				message: 'message',
				nameColor: '#111111',
				textColor: '#222222',
				backgroundColor: '#333333',
				textSize: 20,
				isTextBold: true,
			}),
		).toEqual({
			timeline_id: 'timeline-a',
			name_color: '#111111',
			text_color: '#222222',
			background_color: '#333333',
			user_gift_pt: 0,
			total_user_gift_pt: 0,
			message: 'message',
			text_size: 20,
			is_text_bold: true,
		});
	});
});
