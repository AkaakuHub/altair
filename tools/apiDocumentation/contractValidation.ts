import Ajv2020 from 'ajv/dist/2020.js';
import { createSchemaExample } from '../../src/apiDocumentation/schemaExample.ts';
import type { JsonObject } from '../../src/state/json-state-utils.ts';

export function createContractValidator(
	schemas: Readonly<Record<string, JsonObject>>,
) {
	const validator = new Ajv2020({ strict: true, allowUnionTypes: true });
	validator.addKeyword({ keyword: 'components', schemaType: 'object' });
	const schemaId = 'https://example.invalid/contracts';
	validator.addSchema({ $id: schemaId, components: { schemas } });
	return (schema: Readonly<JsonObject>, value: unknown): void => {
		const reference = schema.$ref;
		if (
			typeof reference !== 'string' ||
			!reference.startsWith('#/components/schemas/')
		)
			throw new Error('Expected a contract schema reference');
		const validate = validator.getSchema(`${schemaId}${reference}`);
		if (validate === undefined)
			throw new Error(`Missing contract schema: ${reference}`);
		if (!validate(value))
			throw new Error(
				`Invalid contract value for ${reference}: ${validator.errorsText(validate.errors)}`,
			);
	};
}

export function validateContractExamples(
	contracts: Readonly<{
		sessionErrorSchema: string;
		schemas: Readonly<Record<string, JsonObject>>;
		endpoints: readonly Readonly<{
			requestSchema: string;
			responseSchema: string;
		}>[];
	}>,
): void {
	const validate = createContractValidator(contracts.schemas);
	const names = new Set([
		contracts.sessionErrorSchema,
		...contracts.endpoints.flatMap((endpoint) => [
			endpoint.requestSchema,
			endpoint.responseSchema,
		]),
	]);
	for (const name of names) {
		const schema = { $ref: `#/components/schemas/${name}` };
		validate(schema, createSchemaExample(schema, contracts.schemas));
	}
}
