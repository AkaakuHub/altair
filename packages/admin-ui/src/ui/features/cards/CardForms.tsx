import type { UserCard } from '@altair/runtime/admin/dto/admin-catalog-schema.ts';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Grid, TextField } from '@mui/material';
import type { AdminFormValues } from '../../../form-value.ts';
import type { AdminTargetSelectionControl } from '../../../hooks/useAdminTargetSelection.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { AdminTargetSelect } from '../../components/AdminTargetSelect.tsx';
import { DeleteActionButton } from '../../components/DeleteActionButton.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import {
	addCardFormValues,
	type CardEditorForm,
	canAddCard,
	canEditCard,
	removeCardFormValues,
	updateCardFormValues,
} from './card-page-model.ts';

type SubmitPlayerForm = (
	path: string,
	playerId: string,
	values: AdminFormValues,
	afterSubmit?: () => void,
) => Promise<void>;

type CardAddFormProps = {
	isSubmitting: boolean;
	playerId: string;
	cardDatasId: string;
	onCardDatasIdChange: (cardDatasId: string) => void;
	submitPlayerForm: SubmitPlayerForm;
};

export function CardAddForm({
	isSubmitting,
	playerId,
	cardDatasId,
	onCardDatasIdChange,
	submitPlayerForm,
}: CardAddFormProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<AdminSectionCard title={messages.inventory.addCards}>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					if (!isSubmitting && canAddCard(playerId, cardDatasId))
						void submitPlayerForm(
							'/admin/user-card/add',
							playerId,
							addCardFormValues(cardDatasId),
						);
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							fullWidth
							size="small"
							label={messages.inventory.cardId}
							required
							disabled={isSubmitting}
							value={cardDatasId}
							onChange={(event) => onCardDatasIdChange(event.target.value)}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<Button
							fullWidth
							variant="contained"
							startIcon={<AddIcon />}
							type="submit"
							loading={isSubmitting}
							disabled={isSubmitting || !canAddCard(playerId, cardDatasId)}
						>
							{messages.inventory.addCard}
						</Button>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<Button
							fullWidth
							variant="outlined"
							title={messages.inventory.addAllReachableDescription}
							disabled={isSubmitting || playerId.length === 0}
							onClick={() =>
								void submitPlayerForm('/admin/user-card/add-all', playerId, {})
							}
						>
							{messages.inventory.addAllReachableCards}
						</Button>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<Button
							fullWidth
							variant="outlined"
							title={messages.inventory.maxAllReachableDescription}
							disabled={isSubmitting || playerId.length === 0}
							onClick={() =>
								void submitPlayerForm('/admin/user-card/max-all', playerId, {})
							}
						>
							{messages.inventory.maxAllReachableCards}
						</Button>
					</Grid>
				</Grid>
			</Box>
		</AdminSectionCard>
	);
}

type CardUpdateFormProps = {
	isSubmitting: boolean;
	playerId: string;
	form: CardEditorForm;
	selectedCard: UserCard | undefined;
	selection: AdminTargetSelectionControl;
	onFormChange: (form: CardEditorForm) => void;
	onSaved: () => void;
	submitPlayerForm: SubmitPlayerForm;
};

export function CardUpdateForm({
	isSubmitting,
	playerId,
	form,
	selectedCard,
	selection,
	onFormChange,
	onSaved,
	submitPlayerForm,
}: CardUpdateFormProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const isEditable =
		!selection.hasPendingSelection &&
		canEditCard(playerId, form.dCardDatasId, selectedCard);
	return (
		<AdminSectionCard title={messages.inventory.editCard}>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					if (!isSubmitting && isEditable)
						void submitPlayerForm(
							'/admin/user-card',
							playerId,
							updateCardFormValues(form),
							onSaved,
						);
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 4 }}>
						<AdminTargetSelect
							label={messages.inventory.ownedCardId}
							selection={selection}
							disabled={isSubmitting}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<NumericInput
							label={messages.inventory.styleLevel}
							value={form.styleLevel}
							min={0}
							max={selectedCard?.max_style_level ?? 0}
							step={1}
							disabled={isSubmitting || !isEditable}
							onValueChange={(styleLevel) =>
								onFormChange({ ...form, styleLevel })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<NumericInput
							label={messages.inventory.limitBreak}
							value={form.limitBreakTimes}
							min={0}
							max={selectedCard?.max_limit_break_times ?? 0}
							step={1}
							disabled={isSubmitting || !isEditable}
							onValueChange={(limitBreakTimes) =>
								onFormChange({ ...form, limitBreakTimes })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<SaveButton
							fullWidth
							label={messages.inventory.saveCard}
							type="submit"
							loading={isSubmitting}
							disabled={isSubmitting || !isEditable}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<DeleteActionButton
							fullWidth
							disabled={isSubmitting || !isEditable}
							onClick={() =>
								void submitPlayerForm(
									'/admin/user-card/remove',
									playerId,
									removeCardFormValues(form.dCardDatasId),
								)
							}
						/>
					</Grid>
				</Grid>
			</Box>
		</AdminSectionCard>
	);
}
