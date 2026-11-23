import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Grid, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminUnsavedChanges } from '../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../components/AdminSectionCard.tsx';
import { DeleteActionButton } from '../components/DeleteActionButton.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { RowActions } from '../components/RowActions.tsx';
import { SearchablePaginatedDataTable } from '../components/SearchablePaginatedDataTable.tsx';
import { getSelectedAdminPlayerId } from '../features/player-state.ts';
import type { AdminPageProps } from '../page-props.ts';

type StickerCatalogEntry = AdminStateResponse['stickerCatalog'][number];
type UserSticker = NonNullable<
	AdminStateResponse['stickerCollection']
>['stickerInfoList'][number];

export function StickersPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const [stickerId, setStickerId] = useState('');
	useAdminUnsavedChanges(stickerId.length > 0);
	const selectedAdminPlayerId = getSelectedAdminPlayerId(data);
	const currentStickers = useMemo(
		() => getCurrentUserStickers(data, selectedAdminPlayerId),
		[data, selectedAdminPlayerId],
	);
	const { error, isSubmitting, submitPlayerForm } =
		useAdminFormMutation(onReload);
	return (
		<>
			<PageHeader title={messages.pages.stickers} onReload={onReload} />
			<AdminFormStatus error={error} />
			<AdminSectionCard title={messages.inventory.addStickers}>
				<Box
					component="form"
					onSubmit={(event) => {
						event.preventDefault();
						if (
							!isSubmitting &&
							selectedAdminPlayerId.length > 0 &&
							stickerId.trim().length > 0
						)
							void submitPlayerForm(
								'/admin/user-sticker/add',
								selectedAdminPlayerId,
								{ stickerId },
								() => setStickerId(''),
							);
					}}
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 3 }}>
							<TextField
								fullWidth
								size="small"
								label={messages.inventory.stickerId}
								required
								disabled={isSubmitting}
								value={stickerId}
								onChange={(event) => setStickerId(event.target.value)}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 2 }}>
							<Button
								fullWidth
								variant="contained"
								startIcon={<AddIcon />}
								type="submit"
								loading={isSubmitting}
								disabled={
									isSubmitting ||
									selectedAdminPlayerId.length === 0 ||
									stickerId.trim().length === 0
								}
							>
								{messages.inventory.addSticker}
							</Button>
						</Grid>
						<Grid size={{ xs: 12, md: 2 }}>
							<Button
								fullWidth
								variant="outlined"
								disabled={isSubmitting || selectedAdminPlayerId.length === 0}
								onClick={() =>
									void submitPlayerForm(
										'/admin/user-sticker/add-all',
										selectedAdminPlayerId,
										{},
									)
								}
							>
								{messages.inventory.addAllStickers}
							</Button>
						</Grid>
					</Grid>
				</Box>
			</AdminSectionCard>
			<SearchablePaginatedDataTable<UserSticker>
				title={messages.inventory.ownedStickers}
				rows={currentStickers}
				emptyText={messages.inventory.noOwnedStickers}
				getRowKey={(row) => String(row.stickers_id)}
				searchLabel={messages.inventory.searchOwnedStickers}
				filterRows={filterUserStickers}
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
									onClick={() => setStickerId(String(row.stickers_id))}
								>
									{messages.use}
								</Button>
								<DeleteActionButton
									disabled={isSubmitting}
									onClick={() =>
										void submitPlayerForm(
											'/admin/user-sticker/remove',
											selectedAdminPlayerId,
											{ stickerId: String(row.stickers_id) },
										)
									}
								/>
							</RowActions>
						),
					},
					{ key: 'id', label: messages.id, render: (row) => row.stickers_id },
					{ key: 'name', label: messages.name, render: (row) => row.name },
					{
						key: 'text',
						label: messages.inventory.text,
						render: (row) => row.text,
					},
					{
						key: 'requirement',
						label: messages.inventory.requirement,
						render: (row) =>
							`${row.requirement_progress}/${row.requirement_num}`,
					},
					{
						key: 'created',
						label: messages.created,
						render: (row) => row.create_time ?? '',
					},
				]}
			/>
			<SearchablePaginatedDataTable<StickerCatalogEntry>
				title={messages.inventory.stickerCatalog}
				rows={data.stickerCatalog}
				emptyText={messages.inventory.noStickerCatalog}
				getRowKey={(row) => String(row.stickers_id)}
				searchLabel={messages.searchCatalog}
				filterRows={filterStickerCatalog}
				columns={[
					{
						key: 'use',
						label: '',
						render: (row) => (
							<Button
								size="small"
								disabled={isSubmitting}
								onClick={() => setStickerId(String(row.stickers_id))}
							>
								{messages.use}
							</Button>
						),
					},
					{ key: 'id', label: messages.id, render: (row) => row.stickers_id },
					{ key: 'name', label: messages.name, render: (row) => row.name },
					{
						key: 'text',
						label: messages.inventory.text,
						render: (row) => row.text,
					},
					{
						key: 'character',
						label: messages.character,
						render: (row) => row.character_id,
					},
				]}
			/>
		</>
	);
}

function getCurrentUserStickers(
	data: AdminStateResponse,
	playerId: string,
): UserSticker[] {
	if (data.stickerCollection?.playerId !== playerId) {
		return [];
	}
	return data.stickerCollection.stickerInfoList;
}

function filterUserStickers(
	stickers: UserSticker[],
	query: string,
): UserSticker[] {
	return filterStickers(stickers, query, (sticker) =>
		[
			sticker.stickers_id,
			sticker.name,
			sticker.text,
			sticker.requirement_progress,
			sticker.requirement_num,
			sticker.create_time ?? '',
		].join(' '),
	);
}

function filterStickerCatalog(
	catalog: StickerCatalogEntry[],
	query: string,
): StickerCatalogEntry[] {
	return filterStickers(catalog, query, (sticker) =>
		[
			sticker.stickers_id,
			sticker.name,
			sticker.text,
			sticker.character_id,
		].join(' '),
	);
}

function filterStickers<Row>(
	rows: Row[],
	query: string,
	createSearchText: (row: Row) => string,
): Row[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return rows;
	}
	return rows.filter((row) =>
		createSearchText(row).toLowerCase().includes(normalized),
	);
}
