import type { Database } from 'bun:sqlite';
import type {
	MemberFanLevelBoundary,
	MemberFanLevelDefinition,
	SeasonFanLevelBoundary,
} from '../state/member-fan-level-definition.ts';

export type {
	MemberFanLevelBoundary,
	SeasonFanLevelBoundary,
} from '../state/member-fan-level-definition.ts';

type CardMemberFanLevelMaster = {
	characterId: number;
	memberFanLevel: number;
};

type MemberFanLevelRow = {
	member_fan_level: number;
	experience: number;
	cumulative_experience: number;
};

type SeasonFanLevelRow = {
	seasons_id: number;
	season_fan_level: number;
	experience: number;
	cumulative_experience: number;
};

export function getDefaultMemberFanLevelsFromDatabase(
	database: Database,
): MemberFanLevelDefinition[] {
	const rows = database
		.query(
			[
				'SELECT id',
				'FROM master_characters',
				'WHERE is_exist_fan_lv = 1',
				'ORDER BY icon_order_id, id',
			].join(' '),
		)
		.all() as Array<{ id: number }>;
	return rows.map((row) => ({
		characterId: row.id,
		dSeasonFanLevel: 1,
		memberFanLevel: 1,
	}));
}

export function getCardMemberFanLevelDefaultsFromDatabase(
	database: Database,
): CardMemberFanLevelMaster[] {
	const rows = database
		.query(
			[
				'SELECT c.id, c.is_exist_fan_lv',
				'FROM (SELECT DISTINCT characters_id FROM master_card_datas) card_characters',
				'JOIN master_characters c ON c.id = card_characters.characters_id',
				'ORDER BY c.icon_order_id, c.id',
			].join(' '),
		)
		.all() as Array<{ id: number; is_exist_fan_lv: number }>;
	return rows.map((row) => ({
		characterId: row.id,
		memberFanLevel: row.is_exist_fan_lv === 1 ? 1 : 0,
	}));
}

export function getMemberFanLevelTableFromDatabase(
	database: Database,
): MemberFanLevelBoundary[] {
	const rows = database
		.query(
			[
				'SELECT member_fan_level, experience, cumulative_experience',
				'FROM master_member_fan_levels',
				'ORDER BY member_fan_level',
			].join(' '),
		)
		.all() as MemberFanLevelRow[];
	return rows.map((row) => ({
		level: row.member_fan_level,
		experience: row.experience,
		cumulativeExperience: row.cumulative_experience,
	}));
}

export function getSeasonFanLevelTableFromDatabase(
	database: Database,
): SeasonFanLevelBoundary[] {
	const rows = database
		.query(
			[
				'SELECT seasons_id, season_fan_level, experience, cumulative_experience',
				'FROM master_season_fan_levels',
				'ORDER BY seasons_id, season_fan_level',
			].join(' '),
		)
		.all() as SeasonFanLevelRow[];
	return rows.map((row) => ({
		seasonId: row.seasons_id,
		level: row.season_fan_level,
		experience: row.experience,
		cumulativeExperience: row.cumulative_experience,
	}));
}
