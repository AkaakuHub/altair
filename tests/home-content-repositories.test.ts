import { describe, expect, test } from 'bun:test';
import {
	emptyHomeEventScheduleRepository,
	emptyHomeExpiredLimitedGachaTicketNotificationRepository,
	emptyHomeMembershipRepository,
	emptyHomeNewsRepository,
	emptyHomePlanRepository,
	emptyHomeQuestQuitNotificationRepository,
} from '../src/v1/route-support/home-content-repositories.ts';

describe('empty home content repositories', () => {
	test('represent unavailable local subsystems without fabricated content', () => {
		expect(emptyHomeMembershipRepository.getPendingNotifications()).toEqual({
			pendingMembershipIds: [],
			updateConfirmationMembershipIds: [],
		});
		expect(emptyHomePlanRepository.listActivePlans()).toEqual([]);
		expect(
			emptyHomeExpiredLimitedGachaTicketNotificationRepository.listPendingTicketIds(),
		).toEqual([]);
		expect(
			emptyHomeQuestQuitNotificationRepository.getPendingQuestQuit(),
		).toBeNull();
		expect(emptyHomeEventScheduleRepository.getNextSchedule()).toEqual({
			fesLiveNextStartTime: null,
			fesLiveNextEndTime: null,
			withLiveNextStartTime: null,
			withLiveNextEndTime: null,
		});
		expect(emptyHomeNewsRepository.getLatestNewsId()).toBe('');
	});
});
