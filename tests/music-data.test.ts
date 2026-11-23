import { describe, expect, test } from 'bun:test';
import { createLearningStageList } from '../src/v1/active-master-database/learning-stage-data.ts';
import { normalizeLiveCharacterBonus } from '../src/v1/active-master-database/live-character-bonus.ts';
import { createEnabledMusicList } from '../src/v1/active-master-database/music-list-data.ts';

describe('music data response transformation', () => {
	test('music IDを公式のenabled music形状へ変換する', () => {
		expect(createEnabledMusicList([20, 10])).toEqual([
			{ m_musics_id: 20, is_enable: true },
			{ m_musics_id: 10, is_enable: true },
		]);
	});

	test('learning stageの前段clearとEX level条件を維持する', () => {
		const rows = [
			{ id: 1, quest_rank: 1, quest_level: 10, gain_music_exp: 1 },
			{ id: 2, quest_rank: 2, quest_level: 20, gain_music_exp: 2 },
			{ id: 5, quest_rank: 5, quest_level: 50, gain_music_exp: 5 },
		];
		const stages = createLearningStageList(rows, {
			musicExpLevel: 2,
			isMastery: false,
			exReleaseConditionsLevel: 3,
			clearedStageIds: new Set([1]),
		});

		expect(stages.map((stage) => stage.is_lock)).toEqual([false, false, true]);
		expect(stages.map((stage) => stage.page)).toEqual([1, 1, 2]);
	});

	test('character bonusを複製し欠落したmastery listを空配列にする', () => {
		const source = { character_id: 1021 };
		const result = normalizeLiveCharacterBonus(source);

		expect(result).toEqual({
			character_id: 1021,
			music_mastery_bonus_list: [],
		});
		expect(result).not.toBe(source);
		expect(source).toEqual({ character_id: 1021 });
	});
});
