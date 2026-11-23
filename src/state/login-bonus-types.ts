import type { EntityIdentityFingerprint } from './entity-provenance.ts';

export type LoginBonusProgressState = {
	loginBonusId: number;
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	receivedCount: number;
	isReceivedToday: boolean;
	receivedGameDate: string | null;
};

export type LoginBonusActivationState = {
	loginBonusId: number;
	isEnabled: boolean;
};
