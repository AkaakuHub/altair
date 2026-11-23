import type {
	OfficialDataMigrationCategoryPreview,
	OfficialDataMigrationPreview,
} from '@altair/runtime/admin/dto/official-data-migration.ts';
import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { DataTable } from '../../components/DataTable.tsx';

type StatusColor = 'success' | 'warning' | 'default';

export function OfficialMigrationPreviewPanel({
	preview,
}: {
	preview: OfficialDataMigrationPreview;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const copy = messages.officialMigration;
	return (
		<AdminSectionCard title={copy.preview}>
			<Stack spacing={2}>
				<Box>
					<Typography variant="body2">
						{copy.playerId}: {preview.playerId}
					</Typography>
					<Typography variant="body2">
						{copy.format}: {preview.formatVersion} / {copy.events}:{' '}
						{preview.totalEvents}
					</Typography>
					<Typography variant="body2">
						{messages.created}: {preview.createdAtUtc ?? ''}
					</Typography>
				</Box>
				<CategoryTable categories={preview.categories} />
				{preview.errors.length > 0 ? (
					<Stack spacing={1}>
						{preview.errors.map((message) => (
							<Alert key={message} severity="warning">
								{message}
							</Alert>
						))}
					</Stack>
				) : null}
			</Stack>
		</AdminSectionCard>
	);
}

function CategoryTable({
	categories,
}: {
	categories: OfficialDataMigrationCategoryPreview[];
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const copy = messages.officialMigration;
	return (
		<DataTable<OfficialDataMigrationCategoryPreview>
			rows={categories}
			emptyText={copy.noCategories}
			getRowKey={(category) =>
				`${category.category}:${category.sourceEndpoint}`
			}
			columns={[
				{
					key: 'category',
					label: messages.category,
					render: (category) => category.category,
				},
				{
					key: 'endpoint',
					label: copy.endpoint,
					render: (category) => category.sourceEndpoint,
				},
				{
					key: 'status',
					label: messages.status,
					render: (category) => (
						<Chip
							size="small"
							color={statusColor(category)}
							label={copy[category.status]}
						/>
					),
				},
				{
					key: 'responses',
					label: copy.responses,
					align: 'right',
					render: (category) => category.responseCount,
				},
			]}
		/>
	);
}

function statusColor(
	category: OfficialDataMigrationCategoryPreview,
): StatusColor {
	if (category.status === 'captured') {
		return 'success';
	}
	if (category.status === 'missing' || category.status === 'not_applied') {
		return 'warning';
	}
	return 'default';
}
