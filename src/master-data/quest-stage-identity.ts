import type { Database } from 'bun:sqlite';
import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';

type QuestStageIdentityDomain =
	| 'standard-quest-stage'
	| 'dream-quest-stage'
	| 'grand-prix-quest-stage';

type QuestStageIdentityRow = Readonly<{
	id: number;
	parent_id: number;
	stage_type: number;
	live_stages_id: number;
	quest_musics_type: number;
	quest_musics_detail: number;
}>;

export function createQuestStageIdentityFingerprint(
	domain: QuestStageIdentityDomain,
	row: QuestStageIdentityRow,
): EntityIdentityFingerprint {
	return {
		domain,
		value: JSON.stringify([
			row.id,
			row.parent_id,
			row.stage_type,
			row.live_stages_id,
			row.quest_musics_type,
			row.quest_musics_detail,
		]),
	};
}

export function getQuestStageIdentityFingerprint(
	database: Database,
	questLiveType: number,
	stageId: number,
): EntityIdentityFingerprint | undefined {
	if (questLiveType === 1) {
		return findQuestStageIdentityFingerprint(
			database,
			'standard-quest-stage',
			'master_standard_quest_stages',
			'standard_quest_areas_id',
			stageId,
		);
	}
	if (questLiveType === 5) {
		return findQuestStageIdentityFingerprint(
			database,
			'dream-quest-stage',
			'master_dream_quest_stages',
			'dream_quest_series_id',
			stageId,
		);
	}
	return undefined;
}

export function getStandardQuestStageIdentityFingerprints(
	database: Database,
): ReadonlyMap<number, EntityIdentityFingerprint> {
	const rows = database
		.query<QuestStageIdentityRow, []>(
			[
				'SELECT id, standard_quest_areas_id AS parent_id, stage_type, live_stages_id,',
				'quest_musics_type, quest_musics_detail',
				'FROM master_standard_quest_stages',
			].join(' '),
		)
		.all();
	return new Map(
		rows.map((row) => [
			row.id,
			createQuestStageIdentityFingerprint('standard-quest-stage', row),
		]),
	);
}

export function getGrandPrixQuestStageIdentityFingerprint(
	database: Database,
	stageId: number,
): EntityIdentityFingerprint | undefined {
	return findQuestStageIdentityFingerprint(
		database,
		'grand-prix-quest-stage',
		'master_grand_prix_quest_stages',
		'grand_prix_series_id',
		stageId,
	);
}

function findQuestStageIdentityFingerprint(
	database: Database,
	domain: QuestStageIdentityDomain,
	tableName:
		| 'master_standard_quest_stages'
		| 'master_dream_quest_stages'
		| 'master_grand_prix_quest_stages',
	parentColumn:
		| 'standard_quest_areas_id'
		| 'dream_quest_series_id'
		| 'grand_prix_series_id',
	stageId: number,
): EntityIdentityFingerprint | undefined {
	const row = database
		.query<QuestStageIdentityRow, [number]>(
			[
				`SELECT id, ${parentColumn} AS parent_id, stage_type, live_stages_id,`,
				'quest_musics_type, quest_musics_detail',
				`FROM ${tableName} WHERE id = ?`,
			].join(' '),
		)
		.get(stageId);
	return row === null
		? undefined
		: createQuestStageIdentityFingerprint(domain, row);
}
