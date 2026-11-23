import { FormControlLabel, Switch } from '@mui/material';
import { useCallback, useState } from 'react';
import type { DataTableColumn } from './DataTable.tsx';
import { SearchablePaginatedDataTable } from './SearchablePaginatedDataTable.tsx';

type SearchableActiveOnlyPaginatedDataTableProps<Row> = {
	rows: Row[];
	columns: Array<DataTableColumn<Row>>;
	emptyText: string;
	getRowKey: (row: Row) => string;
	searchLabel: string;
	filterRows: (rows: Row[], query: string, activeOnly: boolean) => Row[];
	activeOnlyLabel?: string | undefined;
	title?: string | undefined;
};

export function SearchableActiveOnlyPaginatedDataTable<Row>({
	rows,
	columns,
	emptyText,
	getRowKey,
	searchLabel,
	filterRows,
	activeOnlyLabel = 'Active only',
	title,
}: SearchableActiveOnlyPaginatedDataTableProps<Row>): React.ReactElement {
	const [activeOnly, setActiveOnly] = useState(false);
	const filterActiveRows = useCallback(
		(items: Row[], query: string) => filterRows(items, query, activeOnly),
		[filterRows, activeOnly],
	);
	return (
		<SearchablePaginatedDataTable<Row>
			title={title}
			rows={rows}
			columns={columns}
			emptyText={emptyText}
			getRowKey={getRowKey}
			searchLabel={searchLabel}
			filterRows={filterActiveRows}
			isFiltered={activeOnly}
			renderFilters={(resetPage) => (
				<FormControlLabel
					control={
						<Switch
							checked={activeOnly}
							onChange={(event) => {
								setActiveOnly(event.target.checked);
								resetPage();
							}}
						/>
					}
					label={activeOnlyLabel}
				/>
			)}
		/>
	);
}
