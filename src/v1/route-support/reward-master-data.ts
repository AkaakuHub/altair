import type { Database } from 'bun:sqlite';
import { getCardDetailTemplateByCardDatasIdFromDatabase } from '../../master-data/card-detail-template.ts';
import {
	getCardIdentityFingerprint,
	getItemIdentityFingerprint,
} from '../../master-data/entity-identity-fingerprints.ts';
import { getItemCatalogFromDatabase } from '../../master-data/item-master.ts';
import { getGradePlayPointCapBonusFromDatabase } from '../../master-data/play-point-cap.ts';
import type { RewardMasterData } from '../../state/reward-state.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createRewardMasterData(
	selection: { database: Database; masterReleaseId: string },
	routeContext: Pick<StateRouteContext, 'userCardGetList' | 'userItemsGetList'>,
): RewardMasterData {
	return {
		sourceMasterReleaseId: selection.masterReleaseId,
		userCardGetList: routeContext.userCardGetList,
		userItemsGetList: routeContext.userItemsGetList,
		itemCatalog: getItemCatalogFromDatabase(selection.database),
		getCardDetailTemplateByCardDatasId: (cardDatasId) =>
			getCardDetailTemplateByCardDatasIdFromDatabase(
				selection.database,
				cardDatasId,
			),
		getCardFingerprint: (cardDatasId) =>
			getCardIdentityFingerprint(selection.database, cardDatasId),
		getItemFingerprint: (itemId) =>
			getItemIdentityFingerprint(selection.database, itemId),
		resolveGradePlayPointCapBonus: (gradePoint) =>
			getGradePlayPointCapBonusFromDatabase(selection.database, gradePoint),
	};
}
