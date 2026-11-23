import type { Database } from 'bun:sqlite';
import type {
	QuestMemberFanLevelResponse,
	QuestSectionSkillResponse,
} from '../response-types/quest-common-response-types.ts';

type QuestStageLookup = {
	musicId: number;
	questMusicsType: number;
	gainStylePoint: number;
	useNum: number;
};

type QuestStageLookupFunction = (
	database: Database,
	stageId: number,
) => QuestStageLookup | undefined;

const questStageLookups: readonly QuestStageLookupFunction[] = [
	lookupStandardQuestStage,
	lookupDailyQuestStage,
	lookupDreamQuestStage,
	lookupGradeQuestStage,
	lookupMusicLearningQuestStage,
	lookupGrandPrixQuestStage,
];

const playPointQuestStageLookups: readonly QuestStageLookupFunction[] = [
	lookupStandardQuestStage,
	lookupMusicLearningQuestStage,
];

export function findQuestStageMusicFromDatabase(
	database: Database,
	stageId: number,
): { musicId: number; questMusicsType: number } {
	const stage = lookupQuestStageFromDatabase(database, stageId);
	return stage
		? { musicId: stage.musicId, questMusicsType: stage.questMusicsType }
		: { musicId: 0, questMusicsType: 0 };
}

export function sectionSkillListFromDatabase(
	database: Database,
	stageId: number,
): QuestSectionSkillResponse[] {
	return database
		.query<QuestSectionSkillResponse, [number]>(
			[
				'SELECT section_no, section_skills_id',
				'FROM master_quest_sections',
				'WHERE quest_stages_id = ?',
				'ORDER BY CASE section_no',
				'WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3',
				'WHEN 0 THEN 4 WHEN 4 THEN 5 ELSE 6 END, section_no',
			].join(' '),
		)
		.all(stageId);
}

export function fanLevelInfoListFromState(
	fanLevelList: readonly QuestMemberFanLevelResponse[],
) {
	return fanLevelList.map((row) => ({
		character_id: row.character_id,
		member_fan_level: row.member_fan_level,
	}));
}

export function lookupGainStylePointFromDatabase(
	database: Database,
	stageId: number,
): number {
	return lookupQuestStageFromDatabase(database, stageId)?.gainStylePoint ?? 0;
}

export function lookupQuestStageUseNumFromDatabase(
	database: Database,
	stageId: number,
): number {
	return (
		lookupQuestStageFromDatabase(database, stageId, playPointQuestStageLookups)
			?.useNum ?? 0
	);
}

export function lookupDreamQuestStageUseCostFromDatabase(
	database: Database,
	stageId: number,
): { useType: number; useItem: number; useNum: number } | undefined {
	const row = database
		.query<{ use_type: number; use_item: number; use_num: number }, [number]>(
			'SELECT use_type, use_item, use_num FROM master_dream_quest_stages WHERE id = ?',
		)
		.get(stageId);
	return row
		? { useType: row.use_type, useItem: row.use_item, useNum: row.use_num }
		: undefined;
}

function lookupQuestStageFromDatabase(
	database: Database,
	stageId: number,
	lookups: readonly QuestStageLookupFunction[] = questStageLookups,
): QuestStageLookup | undefined {
	for (const lookup of lookups) {
		const stage = lookup(database, stageId);
		if (stage) return stage;
	}
	return undefined;
}

function lookupStandardQuestStage(
	database: Database,
	stageId: number,
): QuestStageLookup | undefined {
	return lookupQuestStageByTable(
		database,
		stageId,
		'master_standard_quest_stages',
		'gain_style_point',
		'use_num',
	);
}

function lookupDailyQuestStage(
	database: Database,
	stageId: number,
): QuestStageLookup | undefined {
	return lookupQuestStageByTable(
		database,
		stageId,
		'master_daily_quest_stages',
		'gain_style_point',
		'use_num',
	);
}

function lookupDreamQuestStage(
	database: Database,
	stageId: number,
): QuestStageLookup | undefined {
	return lookupQuestStageByTable(
		database,
		stageId,
		'master_dream_quest_stages',
		'0',
		'use_num',
	);
}

function lookupGradeQuestStage(
	database: Database,
	stageId: number,
): QuestStageLookup | undefined {
	return lookupQuestStageByTable(
		database,
		stageId,
		'master_grade_quest_stages',
		'0',
		'0',
	);
}

function lookupMusicLearningQuestStage(
	database: Database,
	stageId: number,
): QuestStageLookup | undefined {
	return lookupQuestStageByTable(
		database,
		stageId,
		'master_music_learning_quest_stages',
		'gain_style_point',
		'use_num',
	);
}

function lookupGrandPrixQuestStage(
	database: Database,
	stageId: number,
): QuestStageLookup | undefined {
	return lookupQuestStageByTable(
		database,
		stageId,
		'master_grand_prix_quest_stages',
		'0',
		'0',
	);
}

function lookupQuestStageByTable(
	database: Database,
	stageId: number,
	tableName: string,
	gainStylePointColumn: string,
	useNumColumn: string,
): QuestStageLookup | undefined {
	const row = database
		.query<
			{
				music_id: number;
				quest_musics_type: number;
				gain_style_point: number;
				use_num: number;
			},
			[number]
		>(
			[
				'SELECT quest_musics_detail AS music_id, quest_musics_type,',
				`${gainStylePointColumn} AS gain_style_point,`,
				`${useNumColumn} AS use_num`,
				`FROM ${tableName}`,
				'WHERE id = ?',
			].join(' '),
		)
		.get(stageId);
	return row
		? {
				musicId: row.music_id,
				questMusicsType: row.quest_musics_type,
				gainStylePoint: Math.max(0, row.gain_style_point),
				useNum: Math.max(0, row.use_num),
			}
		: undefined;
}
