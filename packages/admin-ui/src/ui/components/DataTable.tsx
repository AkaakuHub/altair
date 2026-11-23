import {
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

export type DataTableColumn<Row> = {
	key: string;
	label: string;
	align?: 'left' | 'center' | 'right';
	render: (row: Row) => ReactNode;
};

export type DataTablePagination = {
	totalRows: number;
	page: number;
	rowsPerPage: number;
	onPageChange: (page: number) => void;
	onRowsPerPageChange: (rowsPerPage: number) => void;
};

type DataTableProps<Row> = {
	columns: Array<DataTableColumn<Row>>;
	rows: Row[];
	emptyText: string;
	getRowKey: (row: Row) => string;
	pagination?: DataTablePagination;
	selectedRowKey?: string | undefined;
};

export function DataTable<Row>({
	columns,
	rows,
	emptyText,
	getRowKey,
	pagination,
	selectedRowKey,
}: DataTableProps<Row>): React.ReactElement {
	if (rows.length === 0) {
		return (
			<Typography color="text.secondary" variant="body2">
				{emptyText}
			</Typography>
		);
	}
	return (
		<Paper variant="outlined">
			<TableContainer>
				<Table size="small" stickyHeader>
					<TableHead>
						<TableRow>
							{columns.map((column) => (
								<TableCell key={column.key} align={column.align ?? 'inherit'}>
									{column.label}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map((row) => (
							<TableRow
								key={getRowKey(row)}
								hover
								selected={getRowKey(row) === selectedRowKey}
								aria-selected={
									selectedRowKey === undefined
										? undefined
										: getRowKey(row) === selectedRowKey
								}
							>
								{columns.map((column) => (
									<TableCell key={column.key} align={column.align ?? 'inherit'}>
										{column.render(row)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			{pagination ? (
				<TablePagination
					component="div"
					sx={{
						'& .MuiTablePagination-toolbar': {
							flexWrap: 'wrap',
							justifyContent: 'flex-end',
							rowGap: 1,
							py: 1,
						},
						'& .MuiTablePagination-spacer': { flex: '1 1 0' },
						'& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':
							{ my: 0 },
					}}
					count={pagination.totalRows}
					page={pagination.page}
					rowsPerPage={pagination.rowsPerPage}
					rowsPerPageOptions={[25, 50, 100, 200]}
					onPageChange={(_, page) => pagination.onPageChange(page)}
					onRowsPerPageChange={(event) =>
						pagination.onRowsPerPageChange(Number(event.target.value))
					}
				/>
			) : null}
		</Paper>
	);
}
