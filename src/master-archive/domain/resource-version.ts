import { z } from 'zod';
import {
	parseResourceVersion,
	serializeResourceVersion,
} from '../../resources/domain/assets/resourceVersion.ts';

export const completeResourceVersionSchema = z
	.string()
	.regex(/^R[0-9]{7}@/u)
	.superRefine((value, context) => {
		try {
			if (serializeResourceVersion(parseResourceVersion(value)) === value)
				return;
		} catch {
			context.addIssue({
				code: 'custom',
				message: 'Resource version metadata is invalid',
			});
			return;
		}
		context.addIssue({
			code: 'custom',
			message: 'Resource version metadata is not canonical',
		});
	});

export function resourceVersionRevision(resourceVersion: string): string {
	const value = completeResourceVersionSchema.parse(resourceVersion);
	return value.slice(0, value.indexOf('@'));
}
