import type {
	CardCatalogViewEntry,
	UserCard,
} from '@altair/runtime/admin/dto/admin-catalog-schema.ts';
import { Button } from '@mui/material';
import type { AdminFormValues } from '../../../form-value.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { DeleteActionButton } from '../../components/DeleteActionButton.tsx';
import { RowActions } from '../../components/RowActions.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import {
	filterCardCatalog,
	filterUserCards,
	removeCardFormValues,
} from './card-page-model.ts';

type CardTablesProps = {
	isSubmitting: boolean;
	playerId: string;
	userCards: UserCard[];
	cardCatalog: CardCatalogViewEntry[];
	onEditCard: (card: UserCard) => void;
	onUseCatalogCard: (cardDatasId: string) => void;
	submitPlayerForm: (
		path: string,
		playerId: string,
		values: AdminFormValues,
	) => Promise<void>;
};

export function CardTables({
	isSubmitting,
	playerId,
	userCards,
	cardCatalog,
	onEditCard,
	onUseCatalogCard,
	submitPlayerForm,
}: CardTablesProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<>
			<SearchablePaginatedDataTable<UserCard>
				title={messages.inventory.userCards}
				rows={userCards}
				emptyText={messages.inventory.noUserCards}
				getRowKey={(row) => row.d_card_datas_id}
				searchLabel={messages.inventory.searchUserCards}
				filterRows={filterUserCards}
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
									onClick={() => onEditCard(row)}
								>
									{messages.edit}
								</Button>
								<DeleteActionButton
									disabled={isSubmitting}
									onClick={() =>
										void submitPlayerForm(
											'/admin/user-card/remove',
											playerId,
											removeCardFormValues(row.d_card_datas_id),
										)
									}
								/>
							</RowActions>
						),
					},
					{
						key: 'id',
						label: messages.inventory.cardId,
						render: (row) => row.card_datas_id,
					},
					{ key: 'name', label: messages.name, render: (row) => row.cardName },
					{
						key: 'style',
						label: messages.inventory.style,
						render: (row) => `${row.style_level}/${row.max_style_level}`,
					},
					{
						key: 'limit',
						label: messages.inventory.limit,
						render: (row) =>
							`${row.limit_break_times}/${row.max_limit_break_times}`,
					},
					{
						key: 'dCardDatasId',
						label: messages.inventory.ownedCardId,
						render: (row) => row.d_card_datas_id,
					},
				]}
			/>
			<SearchablePaginatedDataTable<CardCatalogViewEntry>
				title={messages.inventory.cardCatalog}
				rows={cardCatalog}
				emptyText={messages.inventory.noCardCatalog}
				getRowKey={(row) => String(row.cardDatasId)}
				searchLabel={messages.searchCatalog}
				filterRows={filterCardCatalog}
				columns={[
					{
						key: 'use',
						label: '',
						render: (row) => (
							<Button
								size="small"
								disabled={isSubmitting}
								onClick={() => onUseCatalogCard(String(row.cardDatasId))}
							>
								{messages.use}
							</Button>
						),
					},
					{ key: 'id', label: messages.id, render: (row) => row.cardDatasId },
					{ key: 'name', label: messages.name, render: (row) => row.cardName },
					{
						key: 'character',
						label: messages.character,
						render: (row) => row.characterId,
					},
				]}
			/>
		</>
	);
}
