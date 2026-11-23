import type { RegisteredUserState } from '../../server-state-schema.ts';
import {
	type EntityIdentityFingerprint,
	isSameEntityIdentity,
} from '../../state/entity-provenance.ts';
import { applyUserReward } from '../../state/reward-state.ts';
import type { PresentBoxItem } from '../../state/user-presents-state.ts';
import { getNumberField } from './request-fields.ts';
import { createRewardMasterData } from './reward-master-data.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function applyPresentToState(
	c: Context,
	routeContext: StateRouteContext,
	user: RegisteredUserState,
	present: PresentBoxItem,
): void {
	const rewardMasterData = createPresentRewardMasterData(routeContext, present);
	applyUserReward(
		routeContext.state,
		user,
		{
			itemId: present.item_id,
			itemType: present.item_type,
			amount: present.num,
		},
		rewardMasterData,
		routeContext.resolveUserStatus(c, user),
		'present',
	);
}

export function validatePresentReward(
	routeContext: StateRouteContext,
	present: PresentBoxItem,
): void {
	createPresentRewardMasterData(routeContext, present);
}

function createPresentRewardMasterData(
	routeContext: StateRouteContext,
	present: PresentBoxItem,
) {
	const provenance = present.rewardProvenance;
	if (provenance === undefined) {
		throw new Error(
			`present reward provenance not found: ${present.d_present_boxes_id}`,
		);
	}
	const database = routeContext.resolveMasterReleaseDatabase(
		provenance.sourceMasterReleaseId,
	);
	const rewardMasterData = createRewardMasterData(
		{ database, masterReleaseId: provenance.sourceMasterReleaseId },
		routeContext,
	);
	const expectedFingerprint: EntityIdentityFingerprint | undefined =
		present.item_type === 2
			? rewardMasterData.getCardFingerprint(present.item_id)
			: rewardMasterData.getItemFingerprint(present.item_id);
	if (
		expectedFingerprint === undefined ||
		!isSameEntityIdentity(provenance.identityFingerprint, expectedFingerprint)
	) {
		throw new Error(
			`present reward identity mismatch: ${present.d_present_boxes_id}`,
		);
	}
	return rewardMasterData;
}

export function getPresentBoxPageNumber(body: unknown): number {
	const page = getNumberField(body, 'page');
	return page !== undefined && page > 0 ? Math.trunc(page) : 1;
}

import type { Context } from 'hono';
