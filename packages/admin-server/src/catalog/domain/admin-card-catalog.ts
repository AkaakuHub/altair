import type { UserCardTemplateState } from '../../../../../src/state/user-card-types.ts';

export type AdminCardCatalogEntry = {
	cardDatasId: number;
	dCardDatasId: string;
	cardSeriesId: number;
	cardName: string;
	characterId: number;
	evolveTimes: number;
	requiredFanLevel: number;
	styleLevel: number;
	maxStyleLevel: number;
	limitBreakTimes: number;
	maxLimitBreakTimes: number;
	maxRhythmGameSkillLevel: number;
	template: UserCardTemplateState;
};
