import type { Database } from 'bun:sqlite';
import type { GrandPrixRuntimeState } from '../server-state-schema.ts';
import { getGrandPrixRewardDataRows } from './grand-prix-master-queries.ts';
import { normalizeUtcDateTime } from './master-date-time.ts';
import { findMusicSource } from './music-source.ts';

export type GrandPrixAdminSummaryMaster = {
	grandPrixId: number;
	grandPrixType: number;
	name: string;
	description: string;
	startDate: string;
	endDate: string;
	questCount: number;
	stageCount: number;
	rewardCount: number;
};

export type GrandPrixAdminDetailMaster = {
	grandPrixId: number;
	series: GrandPrixAdminSeriesMaster[];
	rhythmGameSeries: GrandPrixAdminRhythmGameSeriesMaster[];
	rewards: GrandPrixAdminRewardMaster[];
};

export type EmptyGrandPrixAdminDetailMaster = {
	series: [];
	rhythmGameSeries: [];
	rewards: [];
};

type GrandPrixAdminMusicResolution =
	| { status: 'resolved'; musicId: number; soundId: number }
	| {
			status: 'unresolved';
			musicId: number | null;
			reason: 'quest-music-type-unresolved' | 'music-master-missing';
	  };

type GrandPrixAdminRhythmGameSeriesMaster = {
	seriesId: number;
	orderId: number;
	questMusicsType: number;
	questMusicsDetail: number;
	music: GrandPrixAdminMusicResolution;
	unresolvedFields: ['name', 'description'];
};

type GrandPrixAdminRewardDataMaster = {
	rewardDataId: number;
	rewardType: number;
	rewardItemId: number;
	rewardNum: number;
	unresolvedFields: [
		'isEmphasize',
		'isUsePresentBox',
		'lifeTimeDay',
		'rewardTextId',
	];
};

type GrandPrixAdminRewardMaster = {
	rewardId: number;
	grandPrixRewardType: number;
	minTargetNum: number;
	maxTargetNum: number;
	isDisplay: boolean;
	rewardDatas: GrandPrixAdminRewardDataMaster[];
};

type GrandPrixAdminSeriesMaster = {
	seriesId: number;
	name: string;
	orderId: number;
	stages: GrandPrixAdminStageMaster[];
};

type GrandPrixAdminStageMaster = {
	stageId: number;
	name: string;
	orderId: number;
	questMusicsType: number;
	questMusicsDetail: number;
	overrideQuestMusicsDetail: number | null;
};

type GrandPrixSummaryRow = {
	id: number;
	name: string;
	description: string;
	grand_prix_type: number;
	start_time: string;
	end_time: string;
	quest_count: number;
	stage_count: number;
	reward_count: number;
};

type GrandPrixSeriesRow = {
	id: number;
	name: string;
	order_id: number;
};

type GrandPrixStageRow = {
	id: number;
	name: string;
	order_id: number;
	quest_musics_type: number;
	quest_musics_detail: number;
};

type GrandPrixRhythmGameSeriesRow = {
	id: number;
	order_id: number;
	quest_musics_type: number;
	quest_musics_detail: number;
};

type GrandPrixRewardRow = {
	id: number;
	grand_prix_reward_type: number;
	min_target_num: number;
	max_target_num: number;
	is_display: number;
};

export function getGrandPrixAdminSummaryFromDatabase(
	database: Database,
): GrandPrixAdminSummaryMaster[] {
	const rows = database
		.query<GrandPrixSummaryRow, []>(
			[
				'SELECT g.id, g.name, g.description, g.grand_prix_type, g.start_time, g.end_time,',
				'COUNT(DISTINCT s.id) AS quest_count, COUNT(st.id) AS stage_count, COUNT(DISTINCT r.id) AS reward_count',
				'FROM master_grand_prix g',
				'LEFT JOIN master_grand_prix_quest_series s ON s.grand_prixes_id = g.id',
				'LEFT JOIN master_grand_prix_quest_stages st ON st.grand_prix_series_id = s.id',
				'LEFT JOIN master_grand_prix_rewards r ON r.grand_prixes_id = g.id AND r.is_display = 1',
				'GROUP BY g.id',
				'ORDER BY g.start_time DESC',
			].join(' '),
		)
		.all();
	return rows.map((row) => ({
		grandPrixId: row.id,
		grandPrixType: row.grand_prix_type,
		name: row.name,
		description: row.description,
		startDate: normalizeUtcDateTime(row.start_time),
		endDate: normalizeUtcDateTime(row.end_time),
		questCount: row.quest_count,
		stageCount: row.stage_count,
		rewardCount: row.reward_count,
	}));
}

export function getGrandPrixAdminDetailFromDatabase(
	database: Database,
	runtime: GrandPrixRuntimeState,
): GrandPrixAdminDetailMaster {
	const seriesRows = database
		.query<GrandPrixSeriesRow, [number]>(
			[
				'SELECT id, name, order_id',
				'FROM master_grand_prix_quest_series',
				'WHERE grand_prixes_id = ?',
				'ORDER BY order_id',
			].join(' '),
		)
		.all(runtime.activeGrandPrixId);
	return {
		grandPrixId: runtime.activeGrandPrixId,
		series: seriesRows.map((series) => ({
			seriesId: series.id,
			name: series.name,
			orderId: series.order_id,
			stages: grandPrixAdminStages(database, series.id, runtime),
		})),
		rhythmGameSeries: grandPrixAdminRhythmGameSeries(
			database,
			runtime.activeGrandPrixId,
		),
		rewards: grandPrixAdminRewards(database, runtime.activeGrandPrixId),
	};
}

function grandPrixAdminRhythmGameSeries(
	database: Database,
	grandPrixId: number,
): GrandPrixAdminRhythmGameSeriesMaster[] {
	const rows = database
		.query<GrandPrixRhythmGameSeriesRow, [number]>(
			[
				'SELECT id, order_id, quest_musics_type, quest_musics_detail',
				'FROM master_grand_prix_rhythm_game_series',
				'WHERE grand_prixes_id = ?',
				'ORDER BY order_id, id',
			].join(' '),
		)
		.all(grandPrixId);
	return rows.map((row) => ({
		seriesId: row.id,
		orderId: row.order_id,
		questMusicsType: row.quest_musics_type,
		questMusicsDetail: row.quest_musics_detail,
		music: resolveGrandPrixAdminMusic(database, row),
		unresolvedFields: ['name', 'description'],
	}));
}

function resolveGrandPrixAdminMusic(
	database: Database,
	series: GrandPrixRhythmGameSeriesRow,
): GrandPrixAdminMusicResolution {
	if (series.quest_musics_type !== 2) {
		return {
			status: 'unresolved',
			musicId: null,
			reason: 'quest-music-type-unresolved',
		};
	}
	const music = findMusicSource(database, series.quest_musics_detail);
	return music === null
		? {
				status: 'unresolved',
				musicId: series.quest_musics_detail,
				reason: 'music-master-missing',
			}
		: { status: 'resolved', musicId: music.id, soundId: music.sound_id };
}

function grandPrixAdminRewards(
	database: Database,
	grandPrixId: number,
): GrandPrixAdminRewardMaster[] {
	const rewards = database
		.query<GrandPrixRewardRow, [number]>(
			[
				'SELECT id, grand_prix_reward_type, min_target_num, max_target_num, is_display',
				'FROM master_grand_prix_rewards WHERE grand_prixes_id = ?',
				'ORDER BY grand_prix_reward_type, min_target_num, id',
			].join(' '),
		)
		.all(grandPrixId);
	return rewards.map((reward) => ({
		rewardId: reward.id,
		grandPrixRewardType: reward.grand_prix_reward_type,
		minTargetNum: reward.min_target_num,
		maxTargetNum: reward.max_target_num,
		isDisplay: reward.is_display === 1,
		rewardDatas: getGrandPrixRewardDataRows(database, reward.id).map(
			(data) => ({
				rewardDataId: data.id,
				rewardType: data.reward_type,
				rewardItemId: data.reward_item_id,
				rewardNum: data.reward_num,
				unresolvedFields: [
					'isEmphasize',
					'isUsePresentBox',
					'lifeTimeDay',
					'rewardTextId',
				],
			}),
		),
	}));
}

function grandPrixAdminStages(
	database: Database,
	seriesId: number,
	runtime: GrandPrixRuntimeState,
): GrandPrixAdminStageMaster[] {
	const stageRows = database
		.query<GrandPrixStageRow, [number]>(
			[
				'SELECT id, name, order_id, quest_musics_type, quest_musics_detail',
				'FROM master_grand_prix_quest_stages',
				'WHERE grand_prix_series_id = ?',
				'ORDER BY order_id',
			].join(' '),
		)
		.all(seriesId);
	return stageRows.map((stage) => {
		const override = runtime.stageOverrides.find(
			(entry) => entry.stageId === stage.id,
		);
		return {
			stageId: stage.id,
			name: stage.name,
			orderId: stage.order_id,
			questMusicsType: stage.quest_musics_type,
			questMusicsDetail: stage.quest_musics_detail,
			overrideQuestMusicsDetail: override?.questMusicsDetail ?? null,
		};
	});
}
