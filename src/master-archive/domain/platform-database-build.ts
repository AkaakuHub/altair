import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import {
	type ActiveDatabaseBuildPlan,
	type ActiveDatabaseTable,
	type ActiveMasterSourceResult,
	createActiveDatabaseBuildPlan,
} from './active-database-build.ts';

type PlatformInput = Readonly<{
	plan: ActiveDatabaseBuildPlan;
	clientVersion: string;
	resourceVersion: string;
}>;

export function createPlatformDatabaseBuildPlan(
	input: Readonly<{ android: PlatformInput; ios: PlatformInput }>,
) {
	const { android, ios } = input;
	if (
		android.plan.releaseIdentity === ios.plan.releaseIdentity &&
		android.plan.logicalDatabaseIdentity !== ios.plan.logicalDatabaseIdentity
	)
		throw new Error('The same master release identity has different content');

	const releaseIdentity = platformDatabaseReleaseIdentity({
		android: android.plan.releaseIdentity,
		ios: ios.plan.releaseIdentity,
	});
	const androidTables = new Map(
		android.plan.tables.map((table) => [table.name, table]),
	);
	const iosTables = new Map(
		ios.plan.tables.map((table) => [table.name, table]),
	);
	const names = [
		...new Set([...androidTables.keys(), ...iosTables.keys()]),
	].sort();
	const aliases = {
		android: Object.fromEntries(
			names.map((name) => [name, androidTables.has(name) ? name : null]),
		),
		ios: Object.fromEntries(
			names.map((name) => [
				name,
				!iosTables.has(name)
					? null
					: sameSqliteTable(androidTables.get(name), iosTables.get(name))
						? name
						: `ios_${name}`,
			]),
		),
	};
	const sources = new Map<string, ActiveMasterSourceResult>();
	for (const source of android.plan.sources)
		sources.set(`${source.kind}:${source.identity}`, source);
	for (const source of ios.plan.sources) {
		const tables = source.tables.flatMap((table) => {
			const name = aliases.ios[table.name];
			if (name === undefined || name === null)
				throw new Error('Platform table alias is absent');
			if (name === table.name) return [];
			return [
				{
					...table,
					name,
					indexes: table.indexes.map((index) => ({
						...index,
						name: `ios_${index.name}`,
					})),
				},
			];
		});
		const key = `${source.kind}:${source.identity}`;
		const existing = sources.get(key);
		if (existing !== undefined && existing.sha256 !== source.sha256)
			throw new Error('Platform source identity has different content');
		sources.set(
			key,
			existing === undefined
				? { ...source, tables }
				: { ...existing, tables: [...existing.tables, ...tables] },
		);
	}
	const rows = (['android', 'ios'] as const).map((platform) => ({
		platform,
		release_id: input[platform].plan.releaseIdentity,
		client_version: input[platform].clientVersion,
		resource_version: input[platform].resourceVersion,
		table_aliases_json: JSON.stringify(aliases[platform]),
	}));
	const sha256 = createHash('sha256')
		.update(JSON.stringify(rows))
		.digest('hex');
	const selectionSource: ActiveMasterSourceResult = {
		kind: 'platform-selection',
		identity: releaseIdentity,
		sha256,
		schemaFingerprints: [],
		tables: [
			{
				name: 'runtime_platform_selection',
				columns: [
					'platform',
					'release_id',
					'client_version',
					'resource_version',
					'table_aliases_json',
				].map((name) => ({ name, type: 'TEXT', nullable: false })),
				primaryKey: ['platform'],
				indexes: [],
				rows,
			},
		],
	};
	return createActiveDatabaseBuildPlan({
		releaseIdentity,
		builderIdentity: 'platform-master-builder-v1',
		sources: [...sources.values(), selectionSource],
	});
}

export function platformDatabaseReleaseIdentity(
	input: Readonly<{ android: string; ios: string }>,
): string {
	return createHash('sha256')
		.update(JSON.stringify({ android: input.android, ios: input.ios }))
		.digest('hex');
}

function sameSqliteTable(
	left: ActiveDatabaseTable | undefined,
	right: ActiveDatabaseTable | undefined,
): boolean {
	if (left === undefined || right === undefined) return false;
	if (
		!isDeepStrictEqual(left.columns, right.columns) ||
		!isDeepStrictEqual(left.primaryKey, right.primaryKey) ||
		!isDeepStrictEqual(
			[...left.indexes].sort((a, b) => a.name.localeCompare(b.name)),
			[...right.indexes].sort((a, b) => a.name.localeCompare(b.name)),
		) ||
		left.rows.length !== right.rows.length
	)
		return false;
	return left.rows.every((row, index) =>
		left.columns.every(({ name }) => {
			const a = row[name];
			const b = right.rows[index]?.[name];
			if (
				typeof a === 'number' &&
				typeof b === 'bigint' &&
				Number.isSafeInteger(a)
			)
				return BigInt(a) === b;
			if (
				typeof b === 'number' &&
				typeof a === 'bigint' &&
				Number.isSafeInteger(b)
			)
				return a === BigInt(b);
			return a === b;
		}),
	);
}
