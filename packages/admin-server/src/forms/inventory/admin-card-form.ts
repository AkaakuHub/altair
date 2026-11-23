import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import type { EntityProvenance } from '../../../../../src/state/entity-provenance.ts';
import { ensureEmptyUserCards } from '../../../../../src/state/user-card-aggregate-state.ts';
import {
	removeUserCard,
	updateUserCardProgress,
} from '../../../../../src/state/user-card-progress-mutation.ts';
import { repairUserCardsToValidState } from '../../../../../src/state/user-card-seed-repair.ts';
import {
	addUserCardFromTemplate,
	assertUserCardTemplateIdentity,
	ensureMaxedUserCardFromTemplate,
} from '../../../../../src/state/user-card-template-state.ts';
import { selectReachableCardCatalogEntries } from '../../catalog/application/admin-card-catalog-selection.ts';
import type { AdminCardCatalogEntry } from '../../catalog/domain/admin-card-catalog.ts';
import {
	type AdminForm,
	getFormInteger,
	getFormString,
} from '../shared/admin-form-values.ts';

export function addUserCardFromForm(
	form: AdminForm,
	state: ServerState,
	cardCatalog: AdminCardCatalogEntry[],
	provenanceByCardDatasId: ReadonlyMap<number, EntityProvenance>,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const cardDatasId = getFormInteger(form, 'cardDatasId', Number.NaN);
	const card = cardCatalog.find((entry) => entry.cardDatasId === cardDatasId);
	const provenance = provenanceByCardDatasId.get(cardDatasId);
	if (playerId.length === 0 || !card || provenance === undefined) {
		return false;
	}
	const userCards = ensureEmptyUserCards(state, playerId);
	return addUserCardFromTemplate(userCards, card.template, provenance);
}

export function addAllUserCardsFromForm(
	form: AdminForm,
	state: ServerState,
	cardCatalog: AdminCardCatalogEntry[],
	userStatusController: UserStatusController,
	provenanceByCardDatasId: ReadonlyMap<number, EntityProvenance>,
): number | undefined {
	return applyReachableUserCardsFromForm(
		form,
		state,
		cardCatalog,
		userStatusController,
		provenanceByCardDatasId,
		(cards, card, provenance) =>
			addUserCardFromTemplate(cards, card.template, provenance),
	);
}

export function maxAllUserCardsFromForm(
	form: AdminForm,
	state: ServerState,
	cardCatalog: AdminCardCatalogEntry[],
	userStatusController: UserStatusController,
	provenanceByCardDatasId: ReadonlyMap<number, EntityProvenance>,
): number | undefined {
	return applyReachableUserCardsFromForm(
		form,
		state,
		cardCatalog,
		userStatusController,
		provenanceByCardDatasId,
		(cards, card, provenance) =>
			ensureMaxedUserCardFromTemplate(
				cards,
				card.template,
				card.maxRhythmGameSkillLevel,
				provenance,
			),
	);
}

function applyReachableUserCardsFromForm(
	form: AdminForm,
	state: ServerState,
	cardCatalog: AdminCardCatalogEntry[],
	userStatusController: UserStatusController,
	provenanceByCardDatasId: ReadonlyMap<number, EntityProvenance>,
	applyCard: (
		cards: ReturnType<typeof ensureEmptyUserCards>,
		card: AdminCardCatalogEntry,
		provenance: EntityProvenance,
	) => boolean,
): number | undefined {
	const playerId = getFormString(form, 'playerId');
	if (playerId.length === 0 || cardCatalog.length === 0) {
		return undefined;
	}
	const userCards = ensureEmptyUserCards(state, playerId);
	const userStatus = userStatusController.ensure(state, playerId).value;
	const reachableCardCatalog = selectReachableCardCatalogEntries(
		cardCatalog,
		userStatus.memberFanLevels,
	);
	if (
		reachableCardCatalog.some(
			(card) => !provenanceByCardDatasId.has(card.cardDatasId),
		)
	) {
		return undefined;
	}
	for (const card of reachableCardCatalog) {
		assertUserCardTemplateIdentity(
			userCards,
			card.template,
			provenanceByCardDatasId.get(card.cardDatasId),
		);
	}
	repairUserCardsToValidState(
		userCards,
		reachableCardCatalog.map((card) => card.template),
	);
	let addedCount = 0;
	for (const card of reachableCardCatalog) {
		const provenance = provenanceByCardDatasId.get(card.cardDatasId);
		if (provenance === undefined) {
			return undefined;
		}
		if (applyCard(userCards, card, provenance)) {
			addedCount += 1;
		}
	}
	return addedCount;
}

export function updateUserCardFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const dCardDatasId = getFormString(form, 'dCardDatasId');
	const styleLevel = getFormInteger(form, 'styleLevel', Number.NaN);
	const limitBreakTimes = getFormInteger(form, 'limitBreakTimes', Number.NaN);
	if (
		playerId.length === 0 ||
		dCardDatasId.length === 0 ||
		!Number.isInteger(styleLevel) ||
		!Number.isInteger(limitBreakTimes)
	) {
		return false;
	}
	return updateUserCardProgress(
		state,
		playerId,
		dCardDatasId,
		styleLevel,
		limitBreakTimes,
	);
}

export function removeUserCardFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const dCardDatasId = getFormString(form, 'dCardDatasId');
	if (playerId.length === 0 || dCardDatasId.length === 0) {
		return false;
	}
	return removeUserCard(state, playerId, dCardDatasId);
}
