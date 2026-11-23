import type { UserCardDetailRequest } from './user-card-deck-request-types.ts';

export type CardStyleLevelUpRequest = UserCardDetailRequest & {
	style_level: number;
};
export type CardSkillCheckRequest = UserCardDetailRequest & {
	skill_type: number;
};
export type CardSkillLevelUpRequest = CardSkillCheckRequest & {
	skill_level: number;
};
export type CardLimitBreakRequest = UserCardDetailRequest & {
	limit_break_step: number;
};
