import type { AdminVisibleServerState } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { adminVisibleServerStateSchema } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import {
	ensureChapterRuntimeState,
	ensureGradeChallengeRuntimeState,
	ensureGradeLiveRuntimeState,
} from '../../../../../src/server-state.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import type { AdminStatePage } from '../domain/admin-state-page.ts';
import type { AdminArchiveActivityReader } from './admin-archive-activity-ports.ts';
import { projectAdminAccountSocialState } from './projectors/admin-account-social-state-projector.ts';
import {
	projectActivityRecordsForAdmin,
	projectArchiveCollectionsForAdmin,
	projectArchiveGiftPointsForAdmin,
} from './projectors/admin-archive-activity-projector.ts';
import { projectAdminCommerceState } from './projectors/admin-commerce-state-projector.ts';
import { projectAdminMissionState } from './projectors/admin-mission-state-projector.ts';
import { removeInternalProvenance } from './projectors/admin-provenance-projector.ts';

export function createAdminVisibleServerState(
	state: ServerState,
	page: AdminStatePage,
	archiveActivityReader: AdminArchiveActivityReader,
	supportedTutorialIds: ReadonlySet<number>,
): AdminVisibleServerState {
	const all = page === 'all';
	const visibleState = {
		...projectAdminAccountSocialState(state, page, supportedTutorialIds),
		...projectAdminCommerceState(state, page),
		...projectAdminMissionState(state, page),
		sessionIssueCount: state.sessionIssueCount,
		launcherInfo: state.launcherInfo,
		maintenanceMode: state.maintenanceMode,
		resourceVersionOverrides:
			all || page === 'overview' || page === 'grand-prix'
				? state.resourceVersionOverrides
				: {},
		chapter: ensureChapterRuntimeState(state),
		grandPrix: state.grandPrix,
		gradeChallenge: ensureGradeChallengeRuntimeState(state),
		gradeLive: ensureGradeLiveRuntimeState(state),
		selectedAdminPlayerId: state.selectedAdminPlayerId,
		registeredUsers: state.registeredUsers,
		userCards: all ? state.userCards : [],
		userDecks: all || page === 'cards' ? state.userDecks : [],
		userActivityRecords:
			all || page === 'activity-record'
				? projectActivityRecordsForAdmin(state, archiveActivityReader)
				: [],
		userArchiveCollections:
			all || page === 'archive'
				? projectArchiveCollectionsForAdmin(state, archiveActivityReader)
				: [],
		archiveGiftPoints:
			all || page === 'archive'
				? projectArchiveGiftPointsForAdmin(state, archiveActivityReader)
				: [],
	};
	return adminVisibleServerStateSchema.parse(
		removeInternalProvenance(visibleState),
	);
}
