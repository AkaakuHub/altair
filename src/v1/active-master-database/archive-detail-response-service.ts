import type { Database } from 'bun:sqlite';
import { resolveOfficialArchiveVideoTimeOffsetSec } from '../../live-broadcast/domain/official-archive-video-time.ts';
import type { SavedArchiveDetail } from '../response-types/archive/savedArchiveDetail.ts';
import type { SavedStationDetail } from '../response-types/archive/savedStationDetail.ts';
import { isJsonRecord } from '../route-support/request-fields.ts';
import { parseJson } from './json-utils.ts';
import type { JsonRecord, StoredResponse } from './types.ts';

type ArchiveDetailRow = {
	response_json: string;
	video_url: string | null;
	live_start_time: string;
	unixtime_live_rec_started: number;
	is_publish_video_url: number | null;
};

type WithStationDetailRow = {
	response_json: string;
	video_url: string | null;
};

type ArchiveDetailResponse<
	Body extends import('../../state/json-state-utils.ts').JsonValue,
> = {
	commentOffsetSecond: number;
	response: StoredResponse<Body>;
};

export function getArchiveDetailFromDatabase(
	database: Database,
	archivesId: string,
	hasExtraAdmission: boolean,
): ArchiveDetailResponse<SavedArchiveDetail> | undefined {
	if (archivesId.length === 0) {
		return undefined;
	}
	const row = database
		.query<ArchiveDetailRow, [string]>(
			[
				'SELECT detail.response_json, detail.video_url, detail.live_start_time,',
				'detail.unixtime_live_rec_started, list.is_publish_video_url',
				'FROM archive_detail AS detail',
				'LEFT JOIN archive_list AS list ON list.archives_id = detail.archives_id',
				'WHERE detail.archives_id = ?',
			].join(' '),
		)
		.get(archivesId);
	if (!row) {
		return undefined;
	}
	const response: StoredResponse<SavedArchiveDetail> = {
		body: parseJson(row.response_json) as SavedArchiveDetail,
		statusCode: 200,
	};
	if (!isJsonRecord(response.body)) {
		return { commentOffsetSecond: 0, response };
	}
	const commentOffsetSecond = normalizeArchivePlaybackTime(response.body, row);
	if (
		row.is_publish_video_url === 1 &&
		row.video_url !== null &&
		row.video_url.length > 0
	) {
		response.body.video_url = row.video_url;
	} else {
		delete response.body.video_url;
	}
	response.body.has_extra_admission = hasExtraAdmission;
	if ('has_admission' in response.body) {
		response.body.has_admission = true;
	}
	return { commentOffsetSecond, response };
}

export function getWithStationDetailFromDatabase(
	database: Database,
	liveId: string,
	hasExtraAdmission: boolean,
): ArchiveDetailResponse<SavedStationDetail> | undefined {
	if (liveId.length === 0) {
		return undefined;
	}
	const row = database
		.query<WithStationDetailRow, [string]>(
			[
				'SELECT response_json, video_url',
				'FROM with_station_detail',
				'WHERE live_id = ?',
			].join(' '),
		)
		.get(liveId);
	if (!row) {
		return undefined;
	}
	const response: StoredResponse<SavedStationDetail> = {
		body: parseJson(row.response_json) as SavedStationDetail,
		statusCode: 200,
	};
	if (!isJsonRecord(response.body)) {
		return { commentOffsetSecond: 0, response };
	}
	if (row.video_url !== null && row.video_url.length > 0) {
		response.body.video_url = row.video_url;
	}
	removeNullChapterPlayTimeSecond(response.body);
	response.body.has_extra_admission = hasExtraAdmission;
	if ('has_admission' in response.body) {
		response.body.has_admission = true;
	}
	return { commentOffsetSecond: 0, response };
}

function removeNullChapterPlayTimeSecond(body: JsonRecord): void {
	if (!Array.isArray(body.chapters)) {
		return;
	}
	body.chapters = body.chapters.map((chapter) => {
		if (!isJsonRecord(chapter) || chapter.play_time_second !== null) {
			return chapter;
		}
		return Object.fromEntries(
			Object.entries(chapter).filter(([key]) => key !== 'play_time_second'),
		);
	});
}

function normalizeArchivePlaybackTime(
	body: JsonRecord,
	row: ArchiveDetailRow,
): number {
	const mainStartSecond = readMainStartSecond(body.chapters);
	const commentStartOffsetSecond = resolveOfficialArchiveVideoTimeOffsetSec({
		liveStartTime: row.live_start_time,
		recordingStartedUnixSec: row.unixtime_live_rec_started,
		mainStartSec: mainStartSecond ?? null,
	});
	if (commentStartOffsetSecond === 0) return 0;
	if (hasArchiveMotionUrl(body)) {
		return commentStartOffsetSecond;
	}
	normalizeChapters(body, commentStartOffsetSecond);
	subtractSecondField(
		body,
		'total_play_time_second_without_extra',
		commentStartOffsetSecond,
	);
	subtractSecondField(
		body,
		'total_play_time_second_including_extra',
		commentStartOffsetSecond + 60,
	);
	return 0;
}

function hasArchiveMotionUrl(body: JsonRecord): boolean {
	return typeof body.archive_url === 'string' && body.archive_url.length > 0;
}

function readMainStartSecond(chapters: unknown): number | undefined {
	if (!Array.isArray(chapters)) {
		return undefined;
	}
	for (const chapter of chapters) {
		if (
			isJsonRecord(chapter) &&
			chapter.is_extra === false &&
			isNonNegativeSafeInteger(chapter.play_time_second)
		) {
			return chapter.play_time_second;
		}
	}
	return undefined;
}

function normalizeChapters(body: JsonRecord, offsetSecond: number): void {
	if (!Array.isArray(body.chapters)) {
		return;
	}
	body.chapters = body.chapters.map((chapter) => {
		if (
			!isJsonRecord(chapter) ||
			!isNonNegativeSafeInteger(chapter.play_time_second)
		) {
			return chapter;
		}
		return {
			...chapter,
			play_time_second: Math.max(0, chapter.play_time_second - offsetSecond),
		};
	});
}

function subtractSecondField(
	body: JsonRecord,
	fieldName: string,
	offsetSecond: number,
): void {
	const value = body[fieldName];
	if (!isNonNegativeSafeInteger(value)) {
		return;
	}
	body[fieldName] = Math.max(0, value - offsetSecond);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
