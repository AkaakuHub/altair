import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGenerator, programFromConfig } from 'typescript-json-schema';
import {
	cloneJsonObject,
	type JsonObject,
	type JsonValue,
} from '../../src/state/json-state-utils.ts';
import {
	type ContractTypeSource,
	discoverTypedEndpoints,
} from './discoverTypedEndpoints.ts';

function componentName(name: string): string {
	return name.replace(/[^a-zA-Z0-9._-]/gu, '_');
}

function convertReferences(
	value: JsonValue,
	names: ReadonlyMap<string, string>,
): JsonValue {
	if (Array.isArray(value))
		return value.map((entry) => convertReferences(entry, names));
	if (value === null || typeof value !== 'object') return value;
	return Object.fromEntries(
		Object.entries(value).map(([key, entry]) => {
			if (key !== '$ref' || typeof entry !== 'string')
				return [key, convertReferences(entry, names)];
			if (!entry.startsWith('#/definitions/'))
				throw new Error(`Unsupported schema reference: ${entry}`);
			const target = names.get(
				decodeURIComponent(entry.slice('#/definitions/'.length))
					.replace(/~1/gu, '/')
					.replace(/~0/gu, '~'),
			);
			if (target === undefined)
				throw new Error(`Schema reference is not defined: ${entry}`);
			return [key, `#/components/schemas/${target}`];
		}),
	);
}

export async function generateTypedContracts(repository: string) {
	const endpoints = await discoverTypedEndpoints(join(repository, 'src/v1'));
	const contracts = new Map<string, ContractTypeSource>();
	for (const endpoint of endpoints) {
		for (const type of [endpoint.request, endpoint.response]) {
			const existing = contracts.get(type.name);
			if (existing !== undefined && existing.module !== type.module)
				throw new Error(`Contract type name is ambiguous: ${type.name}`);
			contracts.set(type.name, type);
		}
	}
	contracts.set('SessionErrorResponse', {
		name: 'SessionErrorResponse',
		module: join(repository, 'src/v1/response-types/common-response-types.ts'),
	});
	const temporary = await mkdtemp(join(tmpdir(), 'altair-api-contracts-'));
	try {
		const source = join(temporary, 'contracts.ts');
		await writeFile(
			source,
			[...contracts.values()]
				.map(
					(type) =>
						`export type { ${type.name} } from ${JSON.stringify(type.module)};`,
				)
				.join('\n'),
		);
		const generator = buildGenerator(
			programFromConfig(join(repository, 'tsconfig.json'), [source]),
			{
				required: true,
				strictNullChecks: true,
				aliasRef: false,
				uniqueNames: true,
				topRef: true,
			},
		);
		if (generator === null)
			throw new Error('Contract schema program could not be compiled');
		const selectedNames = new Map<string, string>();
		for (const type of contracts.values()) {
			const matches = generator
				.getSymbols(type.name)
				.filter((entry) =>
					entry.symbol.declarations?.some(
						(declaration) =>
							declaration.getSourceFile().fileName === type.module,
					),
				);
			if (matches.length !== 1 || matches[0] === undefined)
				throw new Error(
					`Expected exactly one contract declaration: ${type.name}`,
				);
			selectedNames.set(matches[0].name, type.name);
		}
		const generated = generator.getSchemaForSymbols([...selectedNames.keys()]);
		const definitions = cloneJsonObject(
			JSON.parse(JSON.stringify(generated.definitions)),
			'Generated contract definitions',
		);
		const names = new Map<string, string>();
		const seen = new Set<string>();
		for (const key of Object.keys(definitions)) {
			const name = componentName(key);
			if (seen.has(name))
				throw new Error(`Schema component name collides: ${name}`);
			names.set(key, name);
			seen.add(name);
		}
		const schemas: Record<string, JsonObject> = {};
		for (const [key, value] of Object.entries(definitions)) {
			const name = names.get(key);
			if (name === undefined) throw new Error(`Schema name is missing: ${key}`);
			schemas[name] = cloneJsonObject(
				convertReferences(value, names),
				'OpenAPI schema',
			);
		}
		const contractNames = new Map(
			[...selectedNames].map(([key, name]) => [name, componentName(key)]),
		);
		function nameOf(name: string): string {
			const result = contractNames.get(name);
			if (result === undefined || schemas[result] === undefined)
				throw new Error(`Contract schema is missing: ${name}`);
			return result;
		}
		return {
			sessionErrorSchema: nameOf('SessionErrorResponse'),
			schemas,
			endpoints: endpoints.map((endpoint) => ({
				method: endpoint.method,
				path: endpoint.path,
				requestSchema: nameOf(endpoint.request.name),
				responseSchema: nameOf(endpoint.response.name),
				requiresSession: endpoint.requiresSession,
			})),
		};
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
}
