export type EntityIdentityFingerprint = Readonly<{
	domain: string;
	value: string;
}>;

export type EntityProvenance = Readonly<{
	sourceMasterReleaseId: string;
	identityFingerprint: EntityIdentityFingerprint;
}>;

export function isSameEntityIdentity(
	stored: EntityIdentityFingerprint | undefined,
	target: EntityIdentityFingerprint,
): boolean {
	return stored?.domain === target.domain && stored.value === target.value;
}
