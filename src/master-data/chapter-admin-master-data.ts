import type { Database } from 'bun:sqlite';
import { normalizeUtcDateTime } from './master-date-time.ts';

export type ChapterAdminSummaryMaster = {
	chapterId: number;
	chapterName: string;
	startDate: string;
	endDate: string;
};

type ChapterSummaryRow = {
	id: number;
	chapter_name: string;
	start_time: string;
	end_time: string;
};

export function getChapterAdminSummaryFromDatabase(
	database: Database,
): ChapterAdminSummaryMaster[] {
	return getChapterSummaryRows(database).map(chapterSummaryFromRow);
}

export function getLatestChapterRuntimeDefaultsFromDatabase(
	database: Database,
): ChapterAdminSummaryMaster | undefined {
	return getChapterAdminSummaryFromDatabase(database)[0];
}

export function getChapterRuntimeDefaultsFromDatabase(
	database: Database,
	chapterId: number,
): ChapterAdminSummaryMaster | undefined {
	const row = database
		.query<ChapterSummaryRow, [number]>(
			[
				'SELECT id, chapter_name, start_time, end_time',
				'FROM master_chapters',
				'WHERE id = ?',
				'LIMIT 1',
			].join(' '),
		)
		.get(chapterId);
	return row === null ? undefined : chapterSummaryFromRow(row);
}

function getChapterSummaryRows(database: Database): ChapterSummaryRow[] {
	return database
		.query<ChapterSummaryRow, []>(
			[
				'SELECT id, chapter_name, start_time, end_time',
				'FROM master_chapters',
				'ORDER BY start_time DESC, id DESC',
			].join(' '),
		)
		.all();
}

function chapterSummaryFromRow(
	row: ChapterSummaryRow,
): ChapterAdminSummaryMaster {
	return {
		chapterId: row.id,
		chapterName: row.chapter_name,
		startDate: normalizeUtcDateTime(row.start_time),
		endDate: normalizeUtcDateTime(row.end_time),
	};
}
