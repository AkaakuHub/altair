import type { Database } from 'bun:sqlite';

type LearningStageAccess = {
	musicExpLevel: number;
	isMastery: boolean;
	exReleaseConditionsLevel: number;
	clearedStageIds: ReadonlySet<number>;
	gainMusicExpOverride?: number;
};

type LearningStageRow = {
	id: number;
	quest_rank: number;
	quest_level: number;
	gain_music_exp: number;
};

export function learningStageListFromDatabase(
	database: Database,
	seriesId: number,
	access: LearningStageAccess,
) {
	const rows = database
		.query(
			[
				'SELECT id, quest_rank, quest_level, gain_music_exp',
				'FROM master_music_learning_quest_stages',
				'WHERE learning_live_series_id = ?',
				'ORDER BY quest_rank',
			].join(' '),
		)
		.all(seriesId) as LearningStageRow[];
	return createLearningStageList(rows, access);
}

export function createLearningStageList(
	rows: readonly LearningStageRow[],
	access: LearningStageAccess,
) {
	return rows.map((row) => ({
		learning_live_stages_id: row.id,
		quest_rank: row.quest_rank,
		quest_level: row.quest_level,
		is_lock: isLearningStageLocked(row, rows, access),
		is_clear: access.clearedStageIds.has(row.id),
		gain_music_exp: access.gainMusicExpOverride ?? row.gain_music_exp,
		page: row.quest_rank <= 4 ? 1 : 2,
	}));
}

export function learningCharacterBonusList() {
	const characterIds = [
		1011, 1020, 1021, 1022, 1023, 1030, 1031, 1032, 1033, 1041, 1042, 1043,
		1044, 1051, 1052,
	];
	return characterIds.map((characterId) => ({
		character_id: characterId,
		music_mastery_bonus: 100,
		love_correction_value: 100,
		music_mastery_bonus_list: [] satisfies [],
		season_fan_level: 0,
	}));
}

export function lookupLearningGainMusicExpFromDatabase(
	database: Database,
	stageId: number,
): number {
	const row = database
		.query<{ gain_music_exp: number }, [number]>(
			'SELECT gain_music_exp FROM master_music_learning_quest_stages WHERE id = ?',
		)
		.get(stageId);
	return row?.gain_music_exp ?? 0;
}

function isLearningStageLocked(
	stage: { id: number; quest_rank: number },
	stages: ReadonlyArray<{ id: number; quest_rank: number }>,
	access: LearningStageAccess,
): boolean {
	if (!access.isMastery && access.musicExpLevel <= 0) return true;
	if (stage.quest_rank === 1) return false;
	if (stage.quest_rank <= 4) {
		const previousStage = stages.find(
			(row) => row.quest_rank === stage.quest_rank - 1,
		);
		return (
			previousStage === undefined ||
			!access.clearedStageIds.has(previousStage.id)
		);
	}
	return access.musicExpLevel < access.exReleaseConditionsLevel;
}
