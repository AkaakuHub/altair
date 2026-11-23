import { z } from 'zod';
import { completeResourceVersionSchema } from './resource-version.ts';

const runtimeReleaseIndexSchema = z.record(
	z.string().regex(/^[0-9a-f]{64}$/u),
	z
		.object({
			android: completeResourceVersionSchema,
			ios: completeResourceVersionSchema,
		})
		.strict(),
);

export type RuntimeReleaseIndex = z.infer<typeof runtimeReleaseIndexSchema>;

export function parseRuntimeReleaseIndex(value: unknown): RuntimeReleaseIndex {
	return runtimeReleaseIndexSchema.parse(value);
}

export function mergeRuntimeReleaseIndexes(
	existing: RuntimeReleaseIndex,
	additions: RuntimeReleaseIndex,
): RuntimeReleaseIndex {
	for (const [releaseId, addition] of Object.entries(additions)) {
		const current = existing[releaseId];
		if (
			current !== undefined &&
			(current.android !== addition.android || current.ios !== addition.ios)
		) {
			throw new Error(`Runtime release index conflicts for ${releaseId}`);
		}
	}
	return parseRuntimeReleaseIndex({ ...existing, ...additions });
}

export function resolveRuntimeReleaseId(
	index: RuntimeReleaseIndex,
	resourceVersions: Readonly<{ android: string; ios: string }>,
): string {
	const matches = Object.entries(index).filter(
		([, indexed]) =>
			indexed.android === resourceVersions.android &&
			indexed.ios === resourceVersions.ios,
	);
	const match = matches[0];
	if (matches.length !== 1 || match === undefined) {
		throw new Error('Runtime resource version pair must resolve exactly once');
	}
	return match[0];
}
