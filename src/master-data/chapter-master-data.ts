import type { Database } from 'bun:sqlite';
import type { ChapterRuntimeState } from '../server-state-schema.ts';
import type {
	ActiveChapterMaster,
	ChapterCategoryMaster,
	ChapterMission,
	ChapterPointReward,
	ChapterPointRewardData,
	ChapterRankMaster,
} from '../state/chapter-definition.ts';

type ActiveChapterRow = {
	id: number;
};

type ChapterCategoryRow = {
	category_id: number;
	limit_point: number;
};

type ChapterPointRewardRow = {
	id: number;
	chapter_point: number;
};

type ChapterPointRewardDataRow = {
	id: number;
	reward_type: number;
	reward_item_id: number;
	reward_num: number;
};

type ChapterMissionRow = {
	id: number;
	description: string;
	mission_condition_num: number;
};

type ChapterRankRow = {
	id: number;
	require_point: number;
};

type ChapterRewardIconFrameRow = {
	reward_icon_frame: number;
};

export function getActiveChapterMasterFromDatabase(
	database: Database,
	runtime: ChapterRuntimeState,
): ActiveChapterMaster {
	if (runtime.activeChapterId <= 0) {
		throw new Error('Active chapter runtime not configured');
	}
	const chapter = database
		.query<ActiveChapterRow, [number]>(
			['SELECT id', 'FROM master_chapters', 'WHERE id = ?', 'LIMIT 1'].join(
				' ',
			),
		)
		.get(runtime.activeChapterId);
	if (chapter === null) {
		throw new Error('Active chapter master not found');
	}
	return {
		chapterId: chapter.id,
		categoryPoints: getChapterCategoryMasters(database),
	};
}

export function getChapterPointRewardsFromDatabase(
	database: Database,
	chapterId: number,
	statusByRewardId: ReadonlyMap<number, number>,
): ChapterPointReward[] {
	return database
		.query<ChapterPointRewardRow, [number]>(
			[
				'SELECT id, chapter_point',
				'FROM master_chapter_point_rewards',
				'WHERE chapter_id = ?',
				'ORDER BY id',
			].join(' '),
		)
		.all(chapterId)
		.map((reward) => ({
			chapter_point_rewards_id: reward.id,
			required_point: reward.chapter_point,
			status: statusByRewardId.get(reward.id) ?? 1,
			reward_datas: getChapterPointRewardData(database, reward.id),
		}));
}

export function getChapterMissionsFromDatabase(
	database: Database,
	categoryId: number,
	missionGroup: number,
): ChapterMission[] {
	return database
		.query<ChapterMissionRow, [number, number]>(
			[
				'SELECT m.id, m.description, m.mission_condition_num',
				'FROM master_chapter_missions m',
				'JOIN master_chapter_mission_categorys c',
				'ON c.id = m.chapter_mission_categorys_id',
				'WHERE c.category_id = ?',
				'AND m.mission_group = ?',
				'ORDER BY m.mission_condition_type DESC, m.sort_order DESC',
			].join(' '),
		)
		.all(categoryId, missionGroup)
		.map((mission) => ({
			mission_id: mission.id,
			name: mission.description,
			achieve_num: mission.mission_condition_num,
			achieved_num: 0,
			is_achieved: false,
			is_received: false,
		}));
}

export function getChapterRankFromDatabase(
	database: Database,
	currentPoint: number,
): ChapterRankMaster {
	const ranks = database
		.query<ChapterRankRow, []>(
			[
				'SELECT id, require_point',
				'FROM master_chapter_ranks',
				'ORDER BY require_point',
			].join(' '),
		)
		.all();
	if (ranks.length === 0) {
		throw new Error('Chapter rank master not found');
	}
	const currentRank = ranks.reduce(
		(rankId, rank) => (currentPoint >= rank.require_point ? rank.id : rankId),
		ranks[0]?.id ?? 1,
	);
	const maxRank = ranks.at(-1);
	if (maxRank === undefined) {
		throw new Error('Chapter max rank master not found');
	}
	return {
		currentRank,
		isMaxRank: currentPoint >= maxRank.require_point,
	};
}

export function getChapterRewardIconFrameIdsBetweenRanksFromDatabase(
	database: Database,
	previousRank: number,
	currentRank: number,
): number[] {
	if (currentRank <= previousRank) {
		return [];
	}
	return database
		.query<ChapterRewardIconFrameRow, [number, number]>(
			[
				'SELECT reward_icon_frame',
				'FROM master_chapter_ranks',
				'WHERE id > ?',
				'AND id <= ?',
				'AND reward_icon_frame > 0',
				'ORDER BY id',
			].join(' '),
		)
		.all(previousRank, currentRank)
		.map((rank) => rank.reward_icon_frame);
}

function getChapterCategoryMasters(
	database: Database,
): ChapterCategoryMaster[] {
	return database
		.query<ChapterCategoryRow, []>(
			[
				'SELECT category_id, limit_point',
				'FROM master_chapter_mission_categorys',
				'ORDER BY category_id',
			].join(' '),
		)
		.all()
		.map((category) => ({
			categoryId: category.category_id,
			maxPoint: category.limit_point,
			isCapped: category.limit_point === 0,
		}));
}

function getChapterPointRewardData(
	database: Database,
	chapterPointRewardsId: number,
): ChapterPointRewardData[] {
	return database
		.query<ChapterPointRewardDataRow, [number]>(
			[
				'SELECT id, reward_type, reward_item_id, reward_num',
				'FROM master_chapter_point_reward_details',
				'WHERE chapter_point_rewards_id = ?',
				'ORDER BY id',
			].join(' '),
		)
		.all(chapterPointRewardsId)
		.map((reward) => ({
			chapter_point_reward_datas_id: reward.id,
			item_type: reward.reward_type,
			item_id: reward.reward_item_id,
			num: reward.reward_num,
		}));
}
