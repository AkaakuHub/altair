import {
	isJsonObject,
	type JsonObject,
	type JsonValue,
} from '../state/json-state-utils.ts';

export function createSchemaExample(
	schema: JsonObject,
	schemas: Readonly<Record<string, JsonObject>>,
): JsonValue {
	const result = example(schema, schemas, new Set());
	if (result === undefined)
		throw new Error('Schema has no supported finite example');
	return result;
}

function example(
	schema: JsonObject,
	schemas: Readonly<Record<string, JsonObject>>,
	references: ReadonlySet<string>,
): JsonValue | undefined {
	const reference = schema.$ref;
	if (typeof reference === 'string') {
		if (references.has(reference)) return undefined;
		const name = reference.replace(/^#\/components\/schemas\//u, '');
		const target = schemas[name];
		if (target === undefined)
			throw new Error(`Schema reference is missing: ${reference}`);
		return example(target, schemas, new Set([...references, reference]));
	}
	if (Array.isArray(schema.examples) && schema.examples.length > 0)
		return schema.examples[0];
	if (Object.hasOwn(schema, 'const')) return schema.const;
	if (Array.isArray(schema.enum)) return schema.enum[0];
	const alternatives = schema.anyOf ?? schema.oneOf;
	if (Array.isArray(alternatives)) {
		for (const candidate of alternatives) {
			if (!isJsonObject(candidate))
				throw new Error('Union schema must be an object');
			const value = example(candidate, schemas, references);
			if (value !== undefined) return value;
		}
		return undefined;
	}
	if (Array.isArray(schema.allOf)) {
		const result: JsonObject = {};
		for (const member of schema.allOf) {
			if (!isJsonObject(member))
				throw new Error('Intersection schema must be an object');
			const value = example(member, schemas, references);
			if (value === undefined) return undefined;
			if (!isJsonObject(value))
				throw new Error('Intersection example must be an object');
			Object.assign(result, value);
		}
		return result;
	}
	const types = Array.isArray(schema.type) ? schema.type : [schema.type];
	for (const type of types) {
		switch (type) {
			case 'string':
				return 'sample';
			case 'number':
			case 'integer':
				return 1;
			case 'boolean':
				return false;
			case 'null':
				return null;
			case 'array':
				return [];
			case 'object': {
				const result: JsonObject = {};
				const properties = schema.properties;
				const required = Array.isArray(schema.required) ? schema.required : [];
				for (const key of required) {
					if (
						typeof key !== 'string' ||
						!isJsonObject(properties) ||
						!isJsonObject(properties[key])
					)
						throw new Error('Required schema property is missing');
					const value = example(properties[key], schemas, references);
					if (value === undefined) return undefined;
					result[key] = value;
				}
				return result;
			}
		}
	}
	if (Object.keys(schema).length === 0) return null;
	throw new Error(`Unsupported schema example: ${JSON.stringify(schema)}`);
}
