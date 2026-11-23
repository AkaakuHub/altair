import type { BinaryCatalogEntry } from './catalogBinary.ts';

export type SqliteBundleRow = {
	uid: bigint;
	label: string;
	type: string;
	resourceType: number;
	size: number;
	checksum: bigint;
	encryptionSalt: bigint;
	priority: number;
};

export type SqliteRelatedRow = {
	uid: bigint;
	value: string;
};

export type SqliteContentRow = {
	uid: bigint;
	label: string;
	type: string;
};

export function catalogEntriesFromSqliteRows(
	bundles: SqliteBundleRow[],
	categories: SqliteRelatedRow[],
	contents: SqliteContentRow[],
	dependencies: SqliteRelatedRow[],
): BinaryCatalogEntry[] {
	const categoryMap = groupValues(categories);
	const dependencyMap = groupValues(dependencies);
	const contentMap = new Map<string, Array<{ label: string; type: string }>>();
	for (const content of contents) {
		const key = content.uid.toString();
		const values = contentMap.get(key) ?? [];
		values.push({ label: content.label, type: content.type });
		contentMap.set(key, values);
	}
	return bundles.map((bundle) => {
		const key = bundle.uid.toString();
		return {
			priority: bundle.priority,
			resourceType: bundle.resourceType,
			size: bundle.size,
			type: bundle.type,
			contents: contentMap.get(key) ?? [],
			categories: categoryMap.get(key) ?? [],
			label: bundle.label,
			dependencies: dependencyMap.get(key) ?? [],
			checksum: unsignedUint64(bundle.checksum),
			encryptionSalt: unsignedUint64(bundle.encryptionSalt),
		};
	});
}

function groupValues(rows: SqliteRelatedRow[]): Map<string, string[]> {
	const grouped = new Map<string, string[]>();
	for (const row of rows) {
		const key = row.uid.toString();
		const values = grouped.get(key) ?? [];
		values.push(row.value);
		grouped.set(key, values);
	}
	return grouped;
}

function unsignedUint64(value: bigint): bigint {
	return value < 0n ? value + 0x10000000000000000n : value;
}
