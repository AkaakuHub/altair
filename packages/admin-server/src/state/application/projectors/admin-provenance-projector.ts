import { isRecord } from '../../../../../../src/state/json-state-utils.ts';

const internalProvenanceKeys = new Set([
	'identityFingerprint',
	'identity_fingerprint',
	'sourceMasterReleaseId',
	'source_master_release_id',
]);

export function removeInternalProvenance(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(removeInternalProvenance);
	if (!isRecord(value)) return value;
	const projected: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(value)) {
		if (internalProvenanceKeys.has(key)) continue;
		projected[key] = removeInternalProvenance(entry);
	}
	return projected;
}
