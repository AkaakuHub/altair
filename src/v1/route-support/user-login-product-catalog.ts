function createProductIds(
	prefix: string,
	ranges: ReadonlyArray<readonly [number, number]>,
): string[] {
	return ranges.flatMap(([first, last]) =>
		Array.from(
			{ length: last - first + 1 },
			(_, offset) => `${prefix}${first + offset}`,
		),
	);
}

export const itemStoreProductIds: readonly string[] = createProductIds(
	'com.oddno.lovelive.item_store_',
	[
		[1001, 1006],
		[1011, 1089],
		[1091, 1116],
		[1118, 1166],
	],
);

export const membershipProductIds = [
	'com.oddno.lovelive.membership_0001',
	'com.oddno.lovelive.membership_0002',
	'com.oddno.lovelive.membership_0003',
	'com.oddno.lovelive.membership_0004',
] as const;

export const siscaProductIds = [
	'com.oddno.lovelive.sisca_01',
	'com.oddno.lovelive.sisca_02',
	'com.oddno.lovelive.sisca_03',
	'com.oddno.lovelive.sisca_04',
	'com.oddno.lovelive.sisca_05',
	'com.oddno.lovelive.sisca_06',
	'com.oddno.lovelive.sisca_202',
	'com.oddno.lovelive.sisca_101',
	'com.oddno.lovelive.sisca_102',
	'com.oddno.lovelive.sisca_201',
] as const;
