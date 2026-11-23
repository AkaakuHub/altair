import type { Database } from 'bun:sqlite';
import type { UserCardTemplateState } from '../state/user-card-types.ts';
import { createCardTemplate } from './card-detail-template.ts';
import {
	getAllCardMasterRows,
	maxRhythmGameSkillLevel,
} from './card-master-query.ts';
import {
	cardRequiredFanLevel,
	localUserCardDataId,
} from './card-master-row.ts';
import { sqlInPlaceholders } from './sql-placeholders.ts';

type CardCatalogEntry = {
	cardDatasId: number;
	dCardDatasId: string;
	cardSeriesId: number;
	cardName: string;
	characterId: number;
	evolveTimes: number;
	requiredFanLevel: number;
	styleLevel: number;
	maxStyleLevel: number;
	limitBreakTimes: number;
	maxLimitBreakTimes: number;
	maxRhythmGameSkillLevel: number;
	template: UserCardTemplateState;
};

export function getAdminCardCatalogFromDatabase(
	database: Database,
): CardCatalogEntry[] {
	return getAllCardMasterRows(database).map((row) => {
		const template = createCardTemplate(database, row);
		return {
			cardDatasId: row.id,
			dCardDatasId: localUserCardDataId(row.id),
			cardSeriesId: row.card_series_id,
			cardName: row.name,
			characterId: row.characters_id,
			evolveTimes: row.evolve_times,
			requiredFanLevel: cardRequiredFanLevel(row),
			styleLevel: readTemplateNumber(template, 'style_level'),
			maxStyleLevel: readTemplateNumber(template, 'max_style_level'),
			limitBreakTimes: readTemplateNumber(template, 'limit_break_times'),
			maxLimitBreakTimes: readTemplateNumber(template, 'max_limit_break_times'),
			maxRhythmGameSkillLevel:
				row.rhythm_game_skill_series_id > 0
					? maxRhythmGameSkillLevel(database, row.rhythm_game_skill_series_id)
					: 0,
			template,
		};
	});
}
export function getAdminCardCatalogCountFromDatabase(
	database: Database,
): number {
	const row = database
		.query('SELECT COUNT(*) AS count FROM master_card_datas')
		.get() as { count: number } | null;
	return row?.count ?? 0;
}
export function getHomeCustomCandidateCardDatasIdsFromDatabase(
	database: Database,
	cardDatasIds: number[],
): number[] {
	const uniqueIds = [...new Set(cardDatasIds)];
	if (uniqueIds.length === 0) return [];
	const rows = database
		.query(
			[
				'SELECT d.id AS card_datas_id, s.evolution0_id',
				'FROM master_card_datas d',
				'JOIN master_card_series s ON s.id = d.card_series_id',
				`WHERE d.id IN (${sqlInPlaceholders(uniqueIds)})`,
			].join(' '),
		)
		.all(...uniqueIds) as { card_datas_id: number; evolution0_id: number }[];
	if (rows.length !== uniqueIds.length)
		throw new Error('home custom card master row count mismatch');
	const evolutionById = new Map(
		rows.map((row) => [row.card_datas_id, row.evolution0_id]),
	);
	const result: number[] = [];
	for (const id of uniqueIds) {
		const evolution0Id = evolutionById.get(id);
		if (evolution0Id === undefined)
			throw new Error(`home custom card master not found: ${id}`);
		if (evolution0Id > 0) result.push(evolution0Id);
	}
	return [...new Set(result)];
}
function readTemplateNumber(
	template: UserCardTemplateState,
	key: string,
): number {
	const value = template[key];
	if (typeof value !== 'number')
		throw new Error(`card template field must be number: ${key}`);
	return value;
}
