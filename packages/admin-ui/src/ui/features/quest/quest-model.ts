import type { MusicLevelBoundary } from '@altair/runtime/admin/dto/admin-grand-prix-schema.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type {
	AdminDreamLiveProgress,
	AdminGradeQuestProgress,
	AdminGrandPrixStageProgress,
	AdminLearningMusicMastery,
	AdminQuestStageProgress,
	AdminUserDailyQuest,
	AdminUserLive,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { findPlayerState } from '../player-state.ts';

export type GrandPrixProgressForm = AdminGrandPrixStageProgress & {
	grandPrixId: number;
};
type MusicLevelTable = readonly MusicLevelBoundary[];

export function findActiveLive(
	data: AdminStateResponse,
	playerId: string,
): AdminUserLive | undefined {
	return findPlayerState(data.state.userLives, playerId);
}

export function findActiveDailyQuest(
	data: AdminStateResponse,
	playerId: string,
): AdminUserDailyQuest | undefined {
	return findPlayerState(data.state.userDailyQuestStates, playerId);
}

export function flattenGrandPrixProgress(
	live: AdminUserLive | undefined,
): GrandPrixProgressForm[] {
	return (
		live?.grandPrixes.flatMap((grandPrix) =>
			grandPrix.stageProgressList.map((progress) => ({
				grandPrixId: grandPrix.grandPrixId,
				...progress,
			})),
		) ?? []
	);
}

export function mergeEdits<Form>(
	rows: Form[],
	edits: Record<string, Form>,
	keyOf: (row: Form) => string,
): Form[] {
	const editMap = new Map(Object.entries(edits));
	const merged = rows.map((row) => editMap.get(keyOf(row)) ?? row);
	const rowKeys = new Set(rows.map(keyOf));
	return [
		...merged,
		...Object.entries(edits)
			.filter(([key]) => !rowKeys.has(key))
			.map(([, row]) => row),
	];
}

export function questProgressKey(
	row: Pick<AdminQuestStageProgress, 'questLiveType' | 'stageId'>,
): string {
	return `${row.questLiveType}-${row.stageId}`;
}

export function dreamLiveProgressKey(
	row: Pick<AdminDreamLiveProgress, 'stageId'>,
): string {
	return String(row.stageId);
}

export function learningMasteryKey(
	row: Pick<AdminLearningMusicMastery, 'musicId'>,
): string {
	return String(row.musicId);
}

export function normalizeLearningForm(
	form: AdminLearningMusicMastery,
	patch: Partial<AdminLearningMusicMastery>,
	musicLevelTable: MusicLevelTable,
): AdminLearningMusicMastery {
	const next = { ...form, ...patch };
	if (patch.isMastery === false) {
		return { ...next, musicExpLevel: 0, earnedMusicExp: 0, isMastery: false };
	}
	if (patch.musicExpLevel !== undefined) {
		const musicExpLevel = Math.max(0, Math.min(50, patch.musicExpLevel));
		return {
			...next,
			musicExpLevel,
			earnedMusicExp:
				musicExpLevel === 0
					? 0
					: earnedExperienceForMusicLevel(musicLevelTable, musicExpLevel),
			isMastery: musicExpLevel > 0,
		};
	}
	if (patch.earnedMusicExp !== undefined) {
		const earnedMusicExp = Math.max(0, patch.earnedMusicExp);
		return {
			...next,
			earnedMusicExp,
			musicExpLevel: musicLevelForEarnedExperience(
				musicLevelTable,
				earnedMusicExp,
			),
			isMastery: true,
		};
	}
	if (patch.isMastery === true) {
		return {
			...next,
			isMastery: true,
			musicExpLevel: musicLevelForEarnedExperience(
				musicLevelTable,
				next.earnedMusicExp,
			),
		};
	}
	return next;
}

export function gradeProgressKey(
	row: Pick<AdminGradeQuestProgress, 'seriesId'>,
): string {
	return String(row.seriesId);
}

export function grandPrixProgressKey(
	row: Pick<GrandPrixProgressForm, 'grandPrixId' | 'stageId'>,
): string {
	return `${row.grandPrixId}-${row.stageId}`;
}

export function removeEdit<Form>(
	key: string,
): (current: Record<string, Form>) => Record<string, Form> {
	return (current) => {
		const next = { ...current };
		delete next[key];
		return next;
	};
}

function earnedExperienceForMusicLevel(
	musicLevelTable: MusicLevelTable,
	musicExpLevel: number,
): number {
	return (
		musicLevelTable.find((entry) => entry.level === musicExpLevel)
			?.cumulativeExperience ?? 0
	);
}

function musicLevelForEarnedExperience(
	musicLevelTable: MusicLevelTable,
	earnedMusicExp: number,
): number {
	const normalizedExp = Math.max(0, earnedMusicExp);
	let musicExpLevel = 1;
	for (const boundary of musicLevelTable) {
		if (boundary.cumulativeExperience > normalizedExp) {
			break;
		}
		musicExpLevel = boundary.level;
	}
	return musicExpLevel;
}
