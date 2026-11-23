import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import type { UserItem } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import AddIcon from '@mui/icons-material/Add';
import { Button, Grid } from '@mui/material';
import { useCallback, useMemo } from 'react';
import type { ItemCatalogEntry } from '../../../../../src/state/item-definition.ts';
import type { AdminFormValues } from '../../form-value.ts';
import { useAdminFormDraft } from '../../hooks/useAdminFormDraft.ts';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminTargetSelection } from '../../hooks/useAdminTargetSelection.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../components/AdminSectionCard.tsx';
import { AdminTargetSelect } from '../components/AdminTargetSelect.tsx';
import { DeleteActionButton } from '../components/DeleteActionButton.tsx';
import { NumericInput } from '../components/NumericInput.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { RowActions } from '../components/RowActions.tsx';
import { SaveButton } from '../components/SaveButton.tsx';
import { SearchablePaginatedDataTable } from '../components/SearchablePaginatedDataTable.tsx';
import {
	createItemForm,
	filterUserItems,
	filterVisibleItemCatalog,
	findItemName,
	getCurrentUserItems,
	isSiscaItemId,
	normalizeItemTargetId,
	parseItemQuantity,
} from '../features/items/item-page-model.ts';
import { getSelectedAdminPlayerId } from '../features/player-state.ts';
import type { AdminPageProps } from '../page-props.ts';

type ItemForm = ReturnType<typeof createItemForm>;
function itemDraftKey(form: ItemForm): string {
	return form.itemId;
}

export function ItemsPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const selectedAdminPlayerId = getSelectedAdminPlayerId(data);
	const currentItems = useMemo(
		() => getCurrentUserItems(data, selectedAdminPlayerId),
		[data, selectedAdminPlayerId],
	);
	const resolveSource = useCallback(
		(current: ItemForm) => createItemForm(current.itemId, currentItems),
		[currentItems],
	);
	const draft = useAdminFormDraft(
		createItemForm('', []),
		resolveSource,
		itemDraftKey,
	);
	const form = draft.value;
	const setForm = draft.setValue;
	const { itemId, itemNum } = form;
	const filterOwnedItems = useCallback(
		(rows: UserItem[], query: string) =>
			filterUserItems(rows, query, data.itemCatalog),
		[data.itemCatalog],
	);
	const selectedItemId = Number(itemId);
	const isSelectedSisca =
		Number.isSafeInteger(selectedItemId) && isSiscaItemId(selectedItemId);
	const { error, isSubmitting, submitPlayerForm, reportError } =
		useAdminFormMutation(onReload);
	const resolveTarget = useCallback(
		(id: string) => createItemForm(id, currentItems),
		[currentItems],
	);
	const targetSelection = useAdminTargetSelection(
		itemId,
		resolveTarget,
		setForm,
		normalizeItemTargetId,
	);
	function submitQuantity(
		path: string,
		values: AdminFormValues,
		minimum: 0 | 1,
	): void {
		if (isSubmitting || targetSelection.hasPendingSelection) return;
		try {
			const quantity = parseItemQuantity(itemNum, minimum, messages.validation);
			void submitPlayerForm(
				path,
				selectedAdminPlayerId,
				{
					...values,
					itemNum: quantity,
				},
				() => {
					if (path === '/admin/user-item/add') setForm(createItemForm('', []));
					else draft.acceptSaved(form);
				},
			);
		} catch (cause: unknown) {
			reportError(cause);
		}
	}

	return (
		<>
			<PageHeader title={messages.pages.items} onReload={onReload} />
			<AdminFormStatus
				error={error}
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<AdminSectionCard title={messages.inventory.addItem}>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 4 }}>
						<AdminTargetSelect
							label={messages.inventory.itemId}
							selection={targetSelection}
							disabled={isSubmitting}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<NumericInput
							label={messages.quantity}
							value={itemNum}
							min={0}
							max={MAX_ADMIN_ITEM_QUANTITY}
							step={1}
							disabled={isSubmitting || targetSelection.hasPendingSelection}
							onValueChange={(itemNum) =>
								setForm((current) => ({ ...current, itemNum }))
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<Button
							fullWidth
							variant="contained"
							loading={isSubmitting}
							startIcon={<AddIcon />}
							disabled={
								selectedAdminPlayerId.length === 0 ||
								isSubmitting ||
								targetSelection.hasPendingSelection ||
								itemId.trim().length === 0 ||
								isSelectedSisca
							}
							onClick={() =>
								submitQuantity('/admin/user-item/add', { itemId }, 1)
							}
						>
							{messages.inventory.addItem}
						</Button>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<Button
							fullWidth
							variant="outlined"
							title={messages.inventory.maxAllItemsDescription}
							disabled={selectedAdminPlayerId.length === 0 || isSubmitting}
							onClick={() =>
								void submitPlayerForm(
									'/admin/user-item/max-all',
									selectedAdminPlayerId,
									{},
								)
							}
						>
							{messages.inventory.maxAllItems}
						</Button>
					</Grid>
				</Grid>
			</AdminSectionCard>
			<SearchablePaginatedDataTable<ItemCatalogEntry>
				title={messages.inventory.itemCatalog}
				rows={data.itemCatalog}
				emptyText={messages.inventory.noItemCatalog}
				getRowKey={(row) => String(row.itemId)}
				searchLabel={messages.searchCatalog}
				filterRows={filterVisibleItemCatalog}
				columns={[
					{
						key: 'use',
						label: '',
						render: (row) => (
							<Button
								size="small"
								disabled={isSubmitting}
								onClick={() => targetSelection.select(String(row.itemId))}
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
			<SearchablePaginatedDataTable<UserItem>
				title={messages.inventory.ownedItems}
				rows={currentItems}
				emptyText={messages.inventory.noUserItems}
				getRowKey={(row) => row.userItemId}
				searchLabel={messages.inventory.searchOwnedItems}
				filterRows={filterOwnedItems}
				columns={[
					{
						key: 'action',
						label: messages.action,
						render: (row) => (
							<RowActions>
								<Button
									size="small"
									variant="outlined"
									disabled={isSubmitting}
									onClick={() => targetSelection.select(String(row.itemId))}
								>
									{messages.edit}
								</Button>
								<SaveButton
									size="small"
									label={messages.inventory.saveQuantity}
									loading={isSubmitting}
									disabled={
										isSubmitting ||
										targetSelection.hasPendingSelection ||
										itemId !== String(row.itemId)
									}
									onClick={() =>
										submitQuantity(
											'/admin/user-item',
											{ userItemId: row.userItemId },
											0,
										)
									}
								/>
								<DeleteActionButton
									label={messages.inventory.zero}
									disabled={isSubmitting}
									onClick={() =>
										void submitPlayerForm(
											'/admin/user-item',
											selectedAdminPlayerId,
											{
												userItemId: row.userItemId,
												itemNum: 0,
											},
										)
									}
								/>
							</RowActions>
						),
					},
					{
						key: 'id',
						label: messages.inventory.itemId,
						render: (row) => row.itemId,
					},
					{
						key: 'name',
						label: messages.name,
						render: (row) => findItemName(data.itemCatalog, row.itemId),
					},
					{ key: 'type', label: messages.type, render: (row) => row.itemType },
					{
						key: 'num',
						label: messages.quantity,
						render: (row) => row.itemNum,
					},
				]}
			/>
		</>
	);
}
