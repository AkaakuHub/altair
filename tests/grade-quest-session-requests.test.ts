import { describe, expect, test } from 'bun:test';
import {
	parseGradeQuestActionRequest,
	parseGradeQuestAddSkillRequest,
	parseGradeQuestStartRequest,
} from '../src/v1/active-master-database/grade-quest-session-requests.ts';

describe('grade quest session requests', () => {
	test('公式request fieldをsession操作値へ変換する', () => {
		expect(parseGradeQuestStartRequest({ grade_quest_series_id: 10311 })).toBe(
			10311,
		);
		expect(
			parseGradeQuestActionRequest({ grade_quest_square_id: 21031101 }),
		).toBe(21031101);
		expect(
			parseGradeQuestAddSkillRequest({
				grade_add_skills_id: 41008001,
				grade_quest_square_id: 21031102,
			}),
		).toEqual({
			gradeAddSkillsId: 41008001,
			gradeQuestSquareId: 21031102,
		});
	});

	test('必須request fieldの欠落を受理しない', () => {
		expect(() => parseGradeQuestStartRequest({})).toThrow(
			'grade_quest_series_id must be a number',
		);
		expect(() => parseGradeQuestActionRequest(null)).toThrow(
			'grade_quest_square_id must be a number',
		);
		expect(() =>
			parseGradeQuestAddSkillRequest({ grade_add_skills_id: 41008001 }),
		).toThrow('grade_quest_square_id must be a number');
	});
});
