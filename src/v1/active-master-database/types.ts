import type { JsonObject, JsonValue } from '../../state/json-state-utils.ts';

export type StoredResponse<Body extends JsonValue = JsonValue> = {
	body: Body;
	statusCode: number;
};

export type JsonRecord = JsonObject;
