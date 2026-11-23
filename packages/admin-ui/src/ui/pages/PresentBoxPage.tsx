import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import type { UserPresent } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Grid, TextField } from '@mui/material';
import { useState } from 'react';
import type { ItemCatalogEntry } from '../../../../../src/state/item-definition.ts';
import { hasAdminDraftChanges } from '../../domain/forms/draft.ts';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import {
	useAdminUnsavedChanges,
	useAdminUnsavedChangesContext,
} from '../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../components/AdminSectionCard.tsx';
import { DeleteActionButton } from '../components/DeleteActionButton.tsx';
import { NumericInput } from '../components/NumericInput.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { SearchablePaginatedDataTable } from '../components/SearchablePaginatedDataTable.tsx';
import {
	findPlayerState,
	getSelectedAdminPlayerId,
} from '../features/player-state.ts';
import type { AdminPageProps } from '../page-props.ts';

function emptyPresentForm(): { itemId: string; num: string; comment: string } {
	return { itemId: '', num: '1', comment: '' };
}

export function PresentBoxPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	const [form, setForm] = useState(emptyPresentForm);
	useAdminUnsavedChanges(hasAdminDraftChanges(emptyPresentForm(), form));
	const { itemId, num, comment } = form;
	const selectedAdminPlayerId = getSelectedAdminPlayerId(data);
	const presentBox = findPlayerState(
		data.state.userPresentBoxes,
		selectedAdminPlayerId,
	);
	const presentList = presentBox?.presentList ?? [];
	const receivedPresentList = presentBox?.receivedPresentList ?? [];
	const { error, isSubmitting, submitPlayerForm } =
		useAdminFormMutation(onReload);
	return (
		<>
			<PageHeader title={messages.pages['present-box']} onReload={onReload} />
			<AdminFormStatus error={error} />
			<AdminSectionCard title={messages.inventory.addPresent}>
				<Box
					component="form"
					onSubmit={(event) => {
						event.preventDefault();
						if (
							isSubmitting ||
							selectedAdminPlayerId.length === 0 ||
							itemId.trim().length === 0
						)
							return;
						void submitPlayerForm(
							'/admin/present',
							selectedAdminPlayerId,
							{
								itemId,
								num: Number(num),
								comment,
							},
							() => setForm(emptyPresentForm()),
						);
					}}
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 3 }}>
							<TextField
								fullWidth
								size="small"
								label={messages.inventory.itemId}
								required
								disabled={isSubmitting}
								value={itemId}
								onChange={(event) => {
									const itemId = event.target.value;
									setForm((current) => ({ ...current, itemId }));
								}}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 2 }}>
							<NumericInput
								label={messages.quantity}
								value={num}
								min={1}
								max={MAX_ADMIN_ITEM_QUANTITY}
								step={1}
								disabled={isSubmitting}
								onValueChange={(num) =>
									setForm((current) => ({ ...current, num }))
								}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 5 }}>
							<TextField
								fullWidth
								size="small"
								label={messages.comment}
								disabled={isSubmitting}
								value={comment}
								onChange={(event) => {
									const comment = event.target.value;
									setForm((current) => ({ ...current, comment }));
								}}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 2 }}>
							<Button
								fullWidth
								variant="contained"
								type="submit"
								loading={isSubmitting}
								startIcon={<AddIcon />}
								disabled={
									selectedAdminPlayerId.length === 0 ||
									itemId.trim().length === 0
								}
							>
								{messages.inventory.addPresent}
							</Button>
						</Grid>
					</Grid>
				</Box>
			</AdminSectionCard>
			<SearchablePaginatedDataTable<UserPresent>
				title={messages.inventory.unreceivedPresents}
				rows={presentList}
				emptyText={messages.inventory.noUnreceivedPresents}
				getRowKey={(row) => row.d_present_boxes_id}
				searchLabel={messages.inventory.searchUnreceivedPresents}
				filterRows={filterUserPresents}
				columns={[
					{
						key: 'item',
						label: messages.inventory.itemId,
						render: (row) => row.item_id,
					},
					{ key: 'name', label: messages.name, render: (row) => row.name },
					{ key: 'num', label: messages.quantity, render: (row) => row.num },
					{
						key: 'comment',
						label: messages.comment,
						render: (row) => row.comment,
					},
					{
						key: 'action',
						label: messages.action,
						render: (row) => (
							<DeleteActionButton
								label={messages.remove}
								disabled={isSubmitting}
								onClick={() =>
									void submitPlayerForm(
										'/admin/present/delete',
										selectedAdminPlayerId,
										{
											presentBoxId: row.d_present_boxes_id,
										},
									)
								}
							/>
						),
					},
				]}
			/>
			<SearchablePaginatedDataTable<UserPresent>
				title={messages.inventory.receivedPresents}
				rows={receivedPresentList}
				emptyText={messages.inventory.noReceivedPresents}
				getRowKey={(row) => row.d_present_boxes_id}
				searchLabel={messages.inventory.searchReceivedPresents}
				filterRows={filterUserPresents}
				columns={[
					{
						key: 'item',
						label: messages.inventory.itemId,
						render: (row) => row.item_id,
					},
					{ key: 'name', label: messages.name, render: (row) => row.name },
					{ key: 'num', label: messages.quantity, render: (row) => row.num },
					{
						key: 'time',
						label: messages.inventory.getTime,
						render: (row) => row.get_time,
					},
				]}
			/>
			<SearchablePaginatedDataTable<ItemCatalogEntry>
				title={messages.inventory.itemCatalog}
				rows={data.itemCatalog}
				emptyText={messages.inventory.noItemCatalog}
				getRowKey={(row) => String(row.itemId)}
				searchLabel={messages.searchCatalog}
				filterRows={filterItemCatalog}
				columns={[
					{
						key: 'use',
						label: '',
						render: (row) => (
							<Button
								size="small"
								disabled={isSubmitting}
								onClick={() =>
									requestAction(() => {
										setForm((current) => ({
											...current,
											itemId: String(row.itemId),
											comment: row.name,
										}));
									})
								}
							>
								{messages.use}
							</Button>
						),
					},
					{ key: 'id', label: messages.id, render: (row) => row.itemId },
					{ key: 'name', label: messages.name, render: (row) => row.name },
					{ key: 'type', label: messages.type, render: (row) => row.itemType },
					{
						key: 'category',
						label: messages.category,
						render: (row) => row.itemCategory,
					},
				]}
			/>
		</>
	);
}

function filterItemCatalog(
	catalog: ItemCatalogEntry[],
	query: string,
): ItemCatalogEntry[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return catalog;
	}
	return catalog.filter((item) =>
		`${item.itemId} ${item.name} ${item.itemType} ${item.itemCategory}`
			.toLowerCase()
			.includes(normalized),
	);
}

function filterUserPresents(
	presents: UserPresent[],
	query: string,
): UserPresent[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return presents;
	}
	return presents.filter((present) =>
		`${present.d_present_boxes_id} ${present.item_id} ${present.name} ${present.num} ${present.comment} ${present.get_time}`
			.toLowerCase()
			.includes(normalized),
	);
}
