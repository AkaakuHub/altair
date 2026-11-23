import type { CardGrowthMutationResponse } from '../../application/card-growth/card-growth-response.ts';
import type { RouteErrorCode } from '../http/route-errors.ts';

type CardGrowthMutationResult =
	| 'cardNotFound'
	| 'incompatibleDefinition'
	| 'insufficientItem'
	| 'masterDataNotFound'
	| 'ok'
	| 'unavailable';

export function cardGrowthMutationErrorCode(
	result: CardGrowthMutationResult,
	unavailableError: RouteErrorCode,
): RouteErrorCode | undefined {
	switch (result) {
		case 'cardNotFound':
			return 'userCardNotFound';
		case 'masterDataNotFound':
			return 'userCardGrowthNotFound';
		case 'unavailable':
			return unavailableError;
		case 'insufficientItem':
			return 'userItemInsufficient';
		case 'incompatibleDefinition':
			return 'userOwnedEntityIncompatible';
		case 'ok':
			return undefined;
	}
}

export function createCardGrowthMutationResponse(): CardGrowthMutationResponse {
	return { result: true };
}
