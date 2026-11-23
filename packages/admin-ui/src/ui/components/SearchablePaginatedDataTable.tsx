import { Grid, Stack } from '@mui/material';
import { type ReactNode, useMemo, useState } from 'react';
import { usePaginatedRows } from '../../hooks/usePaginatedRows.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminSearchField } from './AdminSearchField.tsx';
import { AdminSectionCard } from './AdminSectionCard.tsx';
import {
	DataTable,
	type DataTableColumn,
	type DataTablePagination,
} from './DataTable.tsx';

type SearchablePaginatedDataTableProps<Row> = {
	rows: Row[];
	columns: Array<DataTableColumn<Row>>;
	emptyText: string;
	getRowKey: (row: Row) => string;
	searchLabel: string;
	filterRows: (rows: Row[], query: string) => Row[];
	title?: string | undefined;
	isFiltered?: boolean;
	renderFilters?: (resetPage: () => void) => ReactNode;
	selectedRowKey?: string | undefined;
};

export function SearchablePaginatedDataTable<Row>({
	rows,
	columns,
	emptyText,
	getRowKey,
	searchLabel,
	filterRows,
	title,
	isFiltered = false,
	renderFilters,
	selectedRowKey,
}: SearchablePaginatedDataTableProps<Row>): React.ReactElement {
	const { messages } = useAdminLanguage();
	const [query, setQuery] = useState('');
	const filteredRows = useMemo(
		() => filterRows(rows, query),
		[filterRows, rows, query],
	);
	const paginatedRows = usePaginatedRows(filteredRows);
	const pagination: DataTablePagination = {
		totalRows: paginatedRows.totalRows,
		page: paginatedRows.page,
		rowsPerPage: paginatedRows.rowsPerPage,
		onPageChange: paginatedRows.setPage,
		onRowsPerPageChange: paginatedRows.setRowsPerPage,
	};

	return (
		<AdminSectionCard title={title}>
			<Stack spacing={2}>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 4 }}>
						<AdminSearchField
							fullWidth
							label={searchLabel}
							value={query}
							onValueChange={(value) => {
								setQuery(value);
								paginatedRows.setPage(0);
							}}
						/>
					</Grid>
					{renderFilters === undefined ? null : (
						<Grid size={{ xs: 12, md: 3 }}>
							{renderFilters(() => paginatedRows.setPage(0))}
						</Grid>
					)}
				</Grid>
				<DataTable<Row>
					rows={paginatedRows.pageRows}
					emptyText={
						rows.length > 0 && (query.trim().length > 0 || isFiltered)
							? messages.noMatchingResults
							: emptyText
					}
					getRowKey={getRowKey}
					pagination={pagination}
					columns={columns}
					selectedRowKey={selectedRowKey}
				/>
			</Stack>
		</AdminSectionCard>
	);
}
