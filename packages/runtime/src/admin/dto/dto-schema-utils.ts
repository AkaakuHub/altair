import { z } from 'zod';
import { isJsonObject } from '../../../../../src/state/json-state-utils.ts';

export function objectSchema<T>(): z.ZodType<T> {
	return z.custom<T>(isJsonObject);
}
