import type { Database } from 'bun:sqlite';

type ArchiveRankingPeriod = Readonly<{
	id: number;
	characterId: number;
	startTime: string;
	endTime: string;
}>;

export function findArchiveRankingPeriod(
	database: Database,
	memberId: number,
	targetPeriod: 'current' | 'previous',
	now: string,
): ArchiveRankingPeriod | undefined {
	const row =
		targetPeriod === 'current'
			? database
					.query<ArchiveRankingPeriodRow, [number, string, string]>(
						[
							'SELECT ranking.id, member.characters_id, ranking.start_time, ranking.end_time',
							'FROM master_cheer_rankings AS ranking',
							'JOIN master_cheer_members AS member ON member.id = ranking.cheer_members_id',
							'WHERE member.id = ? AND datetime(ranking.start_time) <= datetime(?)',
							'AND datetime(ranking.end_time) >= datetime(?)',
							'ORDER BY ranking.start_time DESC LIMIT 1',
						].join(' '),
					)
					.get(memberId, now, now)
			: database
					.query<ArchiveRankingPeriodRow, [number, string]>(
						[
							'SELECT ranking.id, member.characters_id, ranking.start_time, ranking.end_time',
							'FROM master_cheer_rankings AS ranking',
							'JOIN master_cheer_members AS member ON member.id = ranking.cheer_members_id',
							'WHERE member.id = ? AND datetime(ranking.end_time) < datetime(?)',
							'ORDER BY ranking.end_time DESC LIMIT 1',
						].join(' '),
					)
					.get(memberId, now);
	return row
		? {
				id: row.id,
				characterId: row.characters_id,
				startTime: toOfficialUtcDateTime(row.start_time),
				endTime: toOfficialUtcDateTime(row.end_time),
			}
		: undefined;
}

export function getArchiveCheerRewards(database: Database, rankingId: number) {
	const rewards = database
		.query<CheerRewardRow, [number]>(
			[
				'SELECT id, min_target_num, max_target_num',
				'FROM master_cheer_rewards WHERE cheer_rankings_id = ?',
				'ORDER BY min_target_num, id',
			].join(' '),
		)
		.all(rankingId);
	const rewardData = database
		.query<CheerRewardDataRow, [number]>(
			[
				'SELECT data.id, data.cheer_rewards_id, data.reward_type,',
				'data.reward_item_id, data.reward_num',
				'FROM master_cheer_reward_datas AS data',
				'JOIN master_cheer_rewards AS reward ON reward.id = data.cheer_rewards_id',
				'WHERE reward.cheer_rankings_id = ? ORDER BY data.id',
			].join(' '),
		)
		.all(rankingId);
	return rewards.map((reward) => ({
		cheer_rewards_id: reward.id,
		min_target_num: reward.min_target_num,
		max_target_num: reward.max_target_num,
		reward_datas: rewardData
			.filter((data) => data.cheer_rewards_id === reward.id)
			.map((data) => ({
				cheer_reward_datas_id: data.id,
				item_id: data.reward_item_id,
				item_type: data.reward_type,
				num: data.reward_num,
			})),
	}));
}

type ArchiveRankingPeriodRow = {
	id: number;
	characters_id: number;
	start_time: string;
	end_time: string;
};

type CheerRewardRow = {
	id: number;
	min_target_num: number;
	max_target_num: number;
};

type CheerRewardDataRow = {
	id: number;
	cheer_rewards_id: number;
	reward_type: number;
	reward_item_id: number;
	reward_num: number;
};

function toOfficialUtcDateTime(value: string): string {
	return value.replace('+00:00', 'Z');
}
