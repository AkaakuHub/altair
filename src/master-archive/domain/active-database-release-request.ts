export type ActiveDatabaseReleaseRequest = Readonly<{
	kind: 'official' | 'platform-selection';
	expectedReleaseIdentity: string;
}>;
