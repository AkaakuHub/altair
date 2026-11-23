import type { RhythmGameSkillType } from '../../application/card-growth/rhythm-game-skill-level-service.ts';

export type RhythmGameSkillLevelUpRequest = {
	d_card_datas_id: string;
	rhythm_game_skill_type: RhythmGameSkillType;
	skill_level: number;
};

export type RhythmGameSkillLevelUpResponse = { result: boolean };
