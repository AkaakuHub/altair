import type { Database } from 'bun:sqlite';

type MusicScoreDifficultyMetadata = {
	level: number;
	maxCombo: number;
	dropRewardSeriesId: number;
	gainMusicExp: number;
};
type MusicDropRewardRow = { id: number; musicDropRewardOdds: number };
export type MusicDropRewardDetail = {
	rewardType: number;
	rewardItemId: number;
	rewardNum: number;
	odds: number;
};

export function getMusicScoreDifficultyMetadata(
	database: Database,
	musicId: number,
	difficulty: number,
): MusicScoreDifficultyMetadata | undefined {
	const levelColumn = difficultyColumn(difficulty, 'level');
	const maxComboColumn = difficultyColumn(difficulty, 'max_combo');
	const dropColumn = difficultyColumn(difficulty, 'drop_reward_series_id');
	const expColumn = difficultyColumn(difficulty, 'gain_music_exp');
	if (
		levelColumn === undefined ||
		maxComboColumn === undefined ||
		dropColumn === undefined ||
		expColumn === undefined
	)
		return undefined;
	const row = database
		.query(
			[
				'SELECT',
				`${levelColumn} AS level,`,
				`${maxComboColumn} AS max_combo,`,
				`${dropColumn} AS drop_reward_series_id,`,
				`${expColumn} AS gain_music_exp`,
				'FROM master_music_scores',
				'WHERE id = ?',
			].join(' '),
		)
		.get(musicId) as {
		level: number;
		max_combo: number;
		drop_reward_series_id: number;
		gain_music_exp: number;
	} | null;
	return row
		? {
				level: row.level,
				maxCombo: row.max_combo,
				dropRewardSeriesId: row.drop_reward_series_id,
				gainMusicExp: row.gain_music_exp,
			}
		: undefined;
}

export function getMusicDropRewardRows(
	database: Database,
	seriesId: number,
): MusicDropRewardRow[] {
	const rows = database
		.query(
			[
				'SELECT id, music_drop_reward_odds',
				'FROM master_music_drop_rewards',
				'WHERE drop_reward_series_id = ?',
				'ORDER BY id',
			].join(' '),
		)
		.all(seriesId) as Array<{ id: number; music_drop_reward_odds: number }>;
	return rows.map((row) => ({
		id: row.id,
		musicDropRewardOdds: row.music_drop_reward_odds,
	}));
}

export function getMusicDropRewardDetails(
	database: Database,
	rewardId: number,
): MusicDropRewardDetail[] {
	const rows = database
		.query(
			[
				'SELECT reward_type, reward_item_id, reward_num, odds',
				'FROM master_music_drop_reward_details',
				'WHERE music_drop_rewards_id = ?',
				'ORDER BY id',
			].join(' '),
		)
		.all(rewardId) as Array<{
		reward_type: number;
		reward_item_id: number;
		reward_num: number;
		odds: number;
	}>;
	return rows.map((row) => ({
		rewardType: row.reward_type,
		rewardItemId: row.reward_item_id,
		rewardNum: row.reward_num,
		odds: row.odds,
	}));
}

function difficultyColumn(
	difficulty: number,
	suffix: 'level' | 'max_combo' | 'drop_reward_series_id' | 'gain_music_exp',
): string | undefined {
	switch (difficulty) {
		case 1:
			return `normal_${suffix}`;
		case 2:
			return `hard_${suffix}`;
		case 3:
			return `expert_${suffix}`;
		case 4:
			return `master_${suffix}`;
		default:
			return undefined;
	}
}
