import type { ActiveGachaHeaderState } from '../../application/gacha-availability-service.ts';
import type { GachaSeriesSummaryMaster } from '../../master-data/gacha-series-master.ts';
import type {
	ChapterRuntimeState,
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import type {
	ActiveChapterMaster,
	ChapterRankMaster,
} from '../../state/chapter-definition.ts';
import type { RhythmGameClassMissionConditionType } from '../../state/rhythm-game-class-mission.ts';
import type { UserRhythmMusicScoreState } from '../../state/user-rhythm-game-types.ts';
import type { getUserStatusView } from '../../state/user-status-projection.ts';

export type RouteResponseHeaderContext = {
	user?: RegisteredUserState | undefined;
	gachaHeaderState?: ActiveGachaHeaderState | undefined;
	date?: Date | undefined;
};

export type ResponseHeaderContext = RouteResponseHeaderContext & {
	getUserStatusView: (
		state: ServerState,
		user: RegisteredUserState | undefined,
	) => ReturnType<typeof getUserStatusView>;
	getActiveChapterMaster: (runtime: ChapterRuntimeState) => ActiveChapterMaster;
	getChapterRank: (currentPoint: number) => ChapterRankMaster;
	getGachaSeriesAdminSummary: () => readonly GachaSeriesSummaryMaster[];
	hasAvailablePetalExchange: (
		state: ServerState,
		user: RegisteredUserState | undefined,
	) => boolean;
	hasAvailableShopExchange: (
		state: ServerState,
		user: RegisteredUserState | undefined,
	) => boolean;
	hasAvailableSiscaStorePurchase: (
		state: ServerState,
		user: RegisteredUserState | undefined,
	) => boolean;
	getReceivableRhythmGameClassDataIds: (input: {
		conditionType: RhythmGameClassMissionConditionType;
		progress: number;
		receivedOrder: number;
	}) => readonly number[];
	projectRhythmMusicScores: (
		scores: readonly UserRhythmMusicScoreState[],
	) => UserRhythmMusicScoreState[];
};
