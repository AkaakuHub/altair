import { useCallback, useMemo, useState } from 'react';
import { useAdminFormDraft } from '../../hooks/useAdminFormDraft.ts';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminTargetSelection } from '../../hooks/useAdminTargetSelection.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { CardAddForm, CardUpdateForm } from '../features/cards/CardForms.tsx';
import { CardTables } from '../features/cards/CardTables.tsx';
import {
	type CardEditorForm,
	createCardEditorForm,
	createCardSelectionForm,
	getCurrentUserCards,
} from '../features/cards/card-page-model.ts';
import { getSelectedAdminPlayerId } from '../features/player-state.ts';
import type { AdminPageProps } from '../page-props.ts';

function cardDraftKey(form: CardEditorForm): string {
	return form.dCardDatasId;
}

export function CardsPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const [cardDatasId, setCardDatasId] = useState('');
	const selectedAdminPlayerId = getSelectedAdminPlayerId(data);
	const currentCards = useMemo(
		() => getCurrentUserCards(data, selectedAdminPlayerId),
		[data, selectedAdminPlayerId],
	);
	const resolveSource = useCallback(
		(current: CardEditorForm) => {
			const card = currentCards.find(
				(entry) => entry.d_card_datas_id === current.dCardDatasId,
			);
			return card === undefined ? null : createCardEditorForm(card);
		},
		[currentCards],
	);
	const draft = useAdminFormDraft(
		createCardSelectionForm(currentCards, ''),
		resolveSource,
		cardDraftKey,
	);
	const cardEditorForm = draft.value;
	const setCardEditorForm = draft.setValue;
	const resolveTarget = useCallback(
		(id: string) => createCardSelectionForm(currentCards, id),
		[currentCards],
	);
	const targetSelection = useAdminTargetSelection(
		cardEditorForm.dCardDatasId,
		resolveTarget,
		setCardEditorForm,
	);
	const selectedCard = currentCards.find(
		(card) => card.d_card_datas_id === cardEditorForm.dCardDatasId,
	);
	const { error, isSubmitting, submitPlayerForm } =
		useAdminFormMutation(onReload);

	return (
		<>
			<PageHeader title={messages.pages.cards} onReload={onReload} />
			<AdminFormStatus
				error={error}
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<CardAddForm
				playerId={selectedAdminPlayerId}
				isSubmitting={isSubmitting}
				cardDatasId={cardDatasId}
				onCardDatasIdChange={setCardDatasId}
				submitPlayerForm={submitPlayerForm}
			/>
			<CardUpdateForm
				isSubmitting={isSubmitting}
				playerId={selectedAdminPlayerId}
				form={cardEditorForm}
				selectedCard={selectedCard}
				selection={targetSelection}
				onFormChange={setCardEditorForm}
				onSaved={() => draft.acceptSaved(cardEditorForm)}
				submitPlayerForm={submitPlayerForm}
			/>
			<CardTables
				isSubmitting={isSubmitting}
				playerId={selectedAdminPlayerId}
				userCards={currentCards}
				cardCatalog={data.cardCatalog}
				onEditCard={(card) =>
					targetSelection.select(card.d_card_datas_id, () =>
						setCardDatasId(String(card.card_datas_id)),
					)
				}
				onUseCatalogCard={setCardDatasId}
				submitPlayerForm={submitPlayerForm}
			/>
		</>
	);
}
