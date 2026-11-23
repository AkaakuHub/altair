import type { GrandPrixRuntimeState } from '../server-state-schema.ts';

const grandPrixClosedStatus = 0;
const grandPrixOpenStatus = 2;

export function clampGrandPrixStatus(status: number): number {
	return Math.min(grandPrixOpenStatus, Math.max(grandPrixClosedStatus, status));
}

export function isGrandPrixClosed(runtime: GrandPrixRuntimeState): boolean {
	return runtime.status <= grandPrixClosedStatus;
}

export function isGrandPrixPlayable(runtime: GrandPrixRuntimeState): boolean {
	return runtime.status >= grandPrixOpenStatus;
}
