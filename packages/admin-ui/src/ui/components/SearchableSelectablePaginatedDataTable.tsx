import { Button } from '@mui/material';
import { useMemo } from 'react';
import { useAdminUnsavedChangesContext } from '../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import type { DataTableColumn } from './DataTable.tsx';
import { SearchablePaginatedDataTable } from './SearchablePaginatedDataTable.tsx';

type SearchableSelectablePaginatedDataTableProps<Row> = {
	rows: Row[];
	columns: Array<DataTableColumn<Row>>;
	emptyText: string;
	getRowKey: (row: Row) => string;
	searchLabel: string;
	filterRows: (rows: Row[], query: string) => Row[];
	selectedRowKey: string | undefined;
	onSelect: (row: Row) => void;
	title?: string | undefined;
	actionLabel?: string | undefined;
	disabled?: boolean;
};

export function SearchableSelectablePaginatedDataTable<Row>({
	rows,
	columns,
	emptyText,
	getRowKey,
	searchLabel,
	filterRows,
	selectedRowKey,
	onSelect,
	title,
	actionLabel: suppliedActionLabel,
	disabled = false,
}: SearchableSelectablePaginatedDataTableProps<Row>): React.ReactElement {
	const { messages } = useAdminLanguage();
	const actionLabel = suppliedActionLabel ?? messages.select;
	const { requestAction } = useAdminUnsavedChangesContext();
	const selectableColumns = useMemo<Array<DataTableColumn<Row>>>(
		() => [
			...columns,
			{
				key: 'select',
				label: messages.action,
				render: (row) => {
					const rowKey = getRowKey(row);
					return (
						<Button
							disabled={disabled}
							size="small"
							variant={rowKey === selectedRowKey ? 'contained' : 'outlined'}
							aria-pressed={rowKey === selectedRowKey}
							aria-label={`${actionLabel}: ${rowKey}`}
							onClick={() => requestAction(() => onSelect(row))}
						>
							{actionLabel}
						</Button>
					);
				},
			},
		],
		[
			messages.action,
			columns,
			getRowKey,
			selectedRowKey,
			onSelect,
			actionLabel,
			disabled,
			requestAction,
		],
	);

	const tableProps = {
		rows,
		emptyText,
		getRowKey,
		searchLabel,
		filterRows,
		selectedRowKey,
		columns: selectableColumns,
	};

	return <SearchablePaginatedDataTable<Row> {...tableProps} title={title} />;
}
