import { useEffect, useMemo, useState } from 'react';

const defaultRowsPerPage = 50;

type PaginatedRows<Row> = {
	pageRows: Row[];
	totalRows: number;
	page: number;
	rowsPerPage: number;
	setPage: (page: number) => void;
	setRowsPerPage: (rowsPerPage: number) => void;
};

export function usePaginatedRows<Row>(rows: Row[]): PaginatedRows<Row> {
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPageState] = useState(defaultRowsPerPage);

	useEffect(() => {
		const lastPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
		if (page > lastPage) {
			setPage(lastPage);
		}
	}, [page, rows.length, rowsPerPage]);

	const pageRows = useMemo(() => {
		const start = page * rowsPerPage;
		return rows.slice(start, start + rowsPerPage);
	}, [page, rows, rowsPerPage]);

	function setRowsPerPage(rowsPerPageValue: number): void {
		setRowsPerPageState(rowsPerPageValue);
		setPage(0);
	}

	return {
		pageRows,
		totalRows: rows.length,
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
	};
}
