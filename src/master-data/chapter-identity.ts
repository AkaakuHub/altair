import type { Database } from 'bun:sqlite';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from '../state/entity-provenance.ts';

type IdentityRow = Record<string, number>;

export function createChapterIdentityFingerprint(source: {
	chapter: readonly [number, number];
	categories: readonly IdentityRow[];
	missions: readonly IdentityRow[];
	rewards: readonly IdentityRow[];
	rewardDetails: readonly IdentityRow[];
}): EntityIdentityFingerprint {
	return {
		domain: 'chapter',
		value: JSON.stringify([
			source.chapter,
			source.categories,
			source.missions,
			source.rewards,
			source.rewardDetails,
		]),
	};
}

export function getChapterProvenance(
	database: Database,
	sourceMasterReleaseId: string,
	chapterId: number,
): EntityProvenance | undefined {
	const chapter = database
		.query<{ id: number; mission_group: number }, [number]>(
			'SELECT id, mission_group FROM master_chapters WHERE id = ?',
		)
		.get(chapterId);
	if (chapter === null) return undefined;
	const categories = database
		.query<IdentityRow, []>(
			'SELECT id, category_id FROM master_chapter_mission_categorys ORDER BY id',
		)
		.all();
	const missions = database
		.query<IdentityRow, [number]>(
			[
				'SELECT id, chapter_mission_categorys_id, mission_condition_type,',
				'mission_condition_detail, transition_contents_id, mission_group',
				'FROM master_chapter_missions WHERE mission_group = ? ORDER BY id',
			].join(' '),
		)
		.all(chapter.mission_group);
	const rewards = database
		.query<IdentityRow, [number]>(
			'SELECT id, chapter_id FROM master_chapter_point_rewards WHERE chapter_id = ? ORDER BY id',
		)
		.all(chapterId);
	const rewardIds = rewards.map((reward) => reward.id ?? 0);
	const rewardDetails =
		rewardIds.length === 0
			? []
			: database
					.query<IdentityRow, number[]>(
						`SELECT id, chapter_point_rewards_id, reward_type, reward_item_id FROM master_chapter_point_reward_details WHERE chapter_point_rewards_id IN (${rewardIds.map(() => '?').join(', ')}) ORDER BY id`,
					)
					.all(...rewardIds);
	return {
		sourceMasterReleaseId,
		identityFingerprint: createChapterIdentityFingerprint({
			chapter: [chapter.id, chapter.mission_group],
			categories,
			missions,
			rewards,
			rewardDetails,
		}),
	};
}
