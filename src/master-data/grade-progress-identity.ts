import type { Database } from 'bun:sqlite';
import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';

type GradeChallengeStageIdentityRow = {
	id: number;
	grade_chal_season_id: number;
	stage_type: number;
	live_stages_id: number;
	quest_musics_type: number;
	quest_musics_detail: number;
};

type GradeChallengeSeasonIdentityRow = {
	id: number;
	give_season_grade_id: number;
};

type GradeQuestSeriesIdentityRow = {
	id: number;
	grade_quest_season_id: number;
	sound_id: number;
};

type GradeQuestSquareIdentityRow = {
	id: number;
	square_id: number;
	open_grade_quest_square_ids: string | null;
};

export function getGradeChallengeStageIdentityFingerprint(
	database: Database,
	stageId: number,
): EntityIdentityFingerprint | undefined {
	const row = database
		.query<GradeChallengeStageIdentityRow, [number]>(
			[
				'SELECT id, grade_chal_season_id, stage_type, live_stages_id,',
				'quest_musics_type, quest_musics_detail',
				'FROM master_grade_chal_quest_stages WHERE id = ?',
			].join(' '),
		)
		.get(stageId);
	return row === null ? undefined : createGradeChallengeStageFingerprint(row);
}

export function getGradeChallengeSeasonIdentityFingerprint(
	database: Database,
	seasonId: number,
): EntityIdentityFingerprint | undefined {
	const season = database
		.query<GradeChallengeSeasonIdentityRow, [number]>(
			'SELECT id, give_season_grade_id FROM master_grade_chal_season WHERE id = ?',
		)
		.get(seasonId);
	if (season === null) return undefined;
	const stages = database
		.query<GradeChallengeStageIdentityRow, [number]>(
			[
				'SELECT id, grade_chal_season_id, stage_type, live_stages_id,',
				'quest_musics_type, quest_musics_detail',
				'FROM master_grade_chal_quest_stages',
				'WHERE grade_chal_season_id = ? ORDER BY id',
			].join(' '),
		)
		.all(seasonId);
	return {
		domain: 'grade-challenge-season',
		value: JSON.stringify([
			season.id,
			season.give_season_grade_id,
			stages.map((stage) => createGradeChallengeStageFingerprint(stage).value),
		]),
	};
}

export function getGradeQuestSeriesIdentityFingerprint(
	database: Database,
	seriesId: number,
): EntityIdentityFingerprint | undefined {
	const series = database
		.query<GradeQuestSeriesIdentityRow, [number]>(
			'SELECT id, grade_quest_season_id, sound_id FROM master_grade_quest_series WHERE id = ?',
		)
		.get(seriesId);
	if (series === null) return undefined;
	const squares = database
		.query<GradeQuestSquareIdentityRow, [number]>(
			[
				'SELECT id, square_id, open_grade_quest_square_ids',
				'FROM master_grade_quest_square',
				'WHERE grade_quest_series_id = ? ORDER BY id',
			].join(' '),
		)
		.all(seriesId);
	return {
		domain: 'grade-quest-series',
		value: JSON.stringify([
			series.id,
			series.grade_quest_season_id,
			series.sound_id,
			squares.map((square) => [
				square.id,
				square.square_id,
				square.open_grade_quest_square_ids,
			]),
		]),
	};
}

export function getGradeQuestSeriesIdentityFingerprints(
	database: Database,
): ReadonlyMap<number, EntityIdentityFingerprint> {
	const seriesIds = database
		.query<{ id: number }, []>(
			'SELECT id FROM master_grade_quest_series ORDER BY id',
		)
		.all();
	return new Map(
		seriesIds.flatMap(({ id }) => {
			const fingerprint = getGradeQuestSeriesIdentityFingerprint(database, id);
			return fingerprint === undefined ? [] : [[id, fingerprint] as const];
		}),
	);
}

function createGradeChallengeStageFingerprint(
	row: GradeChallengeStageIdentityRow,
): EntityIdentityFingerprint {
	return {
		domain: 'grade-challenge-stage',
		value: JSON.stringify([
			row.id,
			row.grade_chal_season_id,
			row.stage_type,
			row.live_stages_id,
			row.quest_musics_type,
			row.quest_musics_detail,
		]),
	};
}
