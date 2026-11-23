import type {
	HomePlan,
	HomeQuestQuitInfo,
} from '../responses/home-response.ts';

export type HomeMembershipNotifications = Readonly<{
	pendingMembershipIds: readonly string[];
	updateConfirmationMembershipIds: readonly string[];
}>;

export type HomeEventSchedule = Readonly<{
	fesLiveNextStartTime: string | null;
	fesLiveNextEndTime: string | null;
	withLiveNextStartTime: string | null;
	withLiveNextEndTime: string | null;
}>;

export const emptyHomeMembershipRepository = {
	getPendingNotifications: (): HomeMembershipNotifications => ({
		pendingMembershipIds: [],
		updateConfirmationMembershipIds: [],
	}),
};

export const emptyHomePlanRepository = {
	listActivePlans: (): readonly HomePlan[] => [],
};

export const emptyHomeExpiredLimitedGachaTicketNotificationRepository = {
	listPendingTicketIds: (): readonly number[] => [],
};

export const emptyHomeQuestQuitNotificationRepository = {
	getPendingQuestQuit: (): HomeQuestQuitInfo | null => null,
};

export const emptyHomeEventScheduleRepository = {
	getNextSchedule: (): HomeEventSchedule => ({
		fesLiveNextStartTime: null,
		fesLiveNextEndTime: null,
		withLiveNextStartTime: null,
		withLiveNextEndTime: null,
	}),
};

export const emptyHomeNewsRepository = {
	getLatestNewsId: (): string => '',
};
