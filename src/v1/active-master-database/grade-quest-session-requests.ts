import { getNumberField } from '../route-support/request-fields.ts';

export function parseGradeQuestStartRequest(body: unknown): number {
	return requiredNumberField(body, 'grade_quest_series_id');
}

export function parseGradeQuestActionRequest(body: unknown): number {
	return requiredNumberField(body, 'grade_quest_square_id');
}

export function parseGradeQuestAddSkillRequest(body: unknown): {
	gradeAddSkillsId: number;
	gradeQuestSquareId: number;
} {
	return {
		gradeAddSkillsId: requiredNumberField(body, 'grade_add_skills_id'),
		gradeQuestSquareId: requiredNumberField(body, 'grade_quest_square_id'),
	};
}

function requiredNumberField(body: unknown, name: string): number {
	const value = getNumberField(body, name);
	if (value === undefined || !Number.isFinite(value)) {
		throw new Error(`${name} must be a number`);
	}
	return value;
}
