import type { JsonObject, JsonValue } from '../state/json-state-utils.ts';

export type ApiParameter = Readonly<{
	name: string;
	in: 'path' | 'query';
	required: boolean;
	schema: Readonly<JsonObject>;
	style?: 'form';
	explode?: boolean;
	example?: JsonValue;
}>;

type JsonContent = Readonly<{
	'application/json': Readonly<{
		schema: Readonly<JsonObject>;
		example: JsonValue;
	}>;
}>;
export type ApiOperation = Readonly<{
	tags: readonly string[];
	security?: readonly Readonly<Record<string, readonly string[]>>[];
	parameters: readonly ApiParameter[];
	requestBody?: Readonly<{ required: boolean; content: JsonContent }>;
	responses: Readonly<
		Record<
			string,
			Readonly<{
				description: string;
				content?: JsonContent;
				headers?: Readonly<
					Record<string, Readonly<{ schema: Readonly<JsonObject> }>>
				>;
			}>
		>
	>;
}>;
