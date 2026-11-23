import type {
	AdminDreamLiveProgress,
	AdminGradeQuestProgress,
	AdminLearningMusicMastery,
	AdminQuestStageProgress,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import {
	type AdminDraftValues,
	hasAdminDraftChanges,
} from '../../../domain/forms/draft.ts';
import type { GrandPrixProgressForm } from './quest-model.ts';

export type QuestProgressDraft = Omit<
	AdminQuestStageProgress,
	'highScore' | 'playCount' | 'bestLoveMusicId'
> & { highScore: string; playCount: string; bestLoveMusicId: string };
export type DreamLiveProgressDraft = Omit<
	AdminDreamLiveProgress,
	'clearTimes' | 'limitBreakTimes'
> & { clearTimes: string; limitBreakTimes: string };
export type LearningProgressDraft = Omit<
	AdminLearningMusicMastery,
	'musicExpLevel' | 'earnedMusicExp'
> & { musicExpLevel: string; earnedMusicExp: string };
export type GradeProgressDraft = Omit<
	AdminGradeQuestProgress,
	'clearStatus'
> & { clearStatus: string };
export type GrandPrixProgressDraft = Omit<
	GrandPrixProgressForm,
	'highScore' | 'dailyBestScore' | 'playCount'
> & { highScore: string; dailyBestScore: string; playCount: string };
export type DailyTicketDraft = { num: string; max: string };

export function createQuestProgressDraft(
	row: AdminQuestStageProgress,
): QuestProgressDraft {
	return {
		...row,
		highScore: String(row.highScore),
		playCount: String(row.playCount),
		bestLoveMusicId: String(row.bestLoveMusicId ?? 0),
	};
}
export function createDreamLiveProgressDraft(
	row: AdminDreamLiveProgress,
): DreamLiveProgressDraft {
	return {
		...row,
		clearTimes: String(row.clearTimes),
		limitBreakTimes: String(row.limitBreakTimes),
	};
}
export function createLearningProgressDraft(
	row: AdminLearningMusicMastery,
): LearningProgressDraft {
	return {
		...row,
		musicExpLevel: String(row.musicExpLevel),
		earnedMusicExp: String(row.earnedMusicExp),
	};
}
export function createGradeProgressDraft(
	row: AdminGradeQuestProgress,
): GradeProgressDraft {
	return { ...row, clearStatus: String(row.clearStatus) };
}
export function createGrandPrixProgressDraft(
	row: GrandPrixProgressForm,
): GrandPrixProgressDraft {
	return {
		...row,
		highScore: String(row.highScore),
		dailyBestScore: String(row.dailyBestScore),
		playCount: String(row.playCount),
	};
}

export function filterQuestProgressRows<Row extends object>(
	rows: Row[],
	query: string,
): Row[] {
	const normalized = query.trim().toLowerCase();
	return normalized === ''
		? rows
		: rows.filter((row) =>
				Object.values(row).some((value) =>
					String(value).toLowerCase().includes(normalized),
				),
			);
}

export function hasQuestProgressChanges<Row extends AdminDraftValues>(
	rows: readonly Row[],
	edits: Readonly<Record<string, Row>>,
	getKey: (row: Row) => string,
): boolean {
	const entries = Object.entries(edits);
	if (entries.length === 0) return false;
	const sourceByKey = new Map(rows.map((row) => [getKey(row), row]));
	return entries.some(([key, value]) => {
		const source = sourceByKey.get(key);
		return source === undefined || hasAdminDraftChanges(source, value);
	});
}
