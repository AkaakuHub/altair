import type { UserCardTemplateState } from '../../state/user-card-types.ts';
import type { UserItemLookup } from './card-growth-items.ts';
import type { CardEvolutionRequirement } from './card-growth-master-source.ts';

export type EvolutionMutationResult =
	| 'ok'
	| 'cardNotFound'
	| 'masterDataNotFound'
	| 'unavailable'
	| 'insufficientItem'
	| 'incompatibleDefinition';

export type EvolutionMutationPlan = {
	dCardDatasId: string;
	nextCard: UserCardTemplateState;
	itemLookup: UserItemLookup;
	requiredItems: Array<{ itemId: number; costNum: number }>;
};

export type EvolutionAvailability =
	| {
			kind: 'max';
			isPossible: false;
			nextMaxStyleLevel: number;
			requiredItems: [];
	  }
	| {
			kind: 'next';
			isPossible: boolean;
			nextMaxStyleLevel: number;
			requiredItems: Array<{ itemId: number; costNum: number }>;
			requirement: CardEvolutionRequirement;
	  };
