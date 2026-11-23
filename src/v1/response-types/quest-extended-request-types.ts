export type GradeQuestStartRequest = { grade_quest_series_id: number };
export type GradeQuestSquareRequest = { grade_quest_square_id: number };
export type GradeQuestAddSkillRequest = GradeQuestSquareRequest & {
	grade_add_skills_id: number;
};
export type MusicLearningMusicRequest = { music_id: number };
export type GrandPrixScopeRequest = { quest_id?: number; stage_id?: number };
export type GrandPrixRankingRequest = { ranking_type?: number };
