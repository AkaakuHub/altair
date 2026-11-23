import type { LauncherInfo, ServerState } from '../server-state-schema.ts';
import { launcherInfoKeys } from './launcher-info-keys.ts';

const releasedStatus = 1;
const notOpenStatus = 0;
const maintenanceStatus = 2;
const liberationAnimeStatus = 3;
const circleUnlockFanLevel = 13;

type LauncherInfoHeaderOptions = {
	hasActiveGacha: boolean;
};

export function createDefaultLauncherInfo(): LauncherInfo {
	return Object.fromEntries(
		launcherInfoKeys.map((key) => [key, releasedStatus]),
	);
}

export function createLauncherInfoHeader(
	state: ServerState,
	fanLevel: number,
	options?: LauncherInfoHeaderOptions,
): LauncherInfo {
	const launcherInfo = {
		...createDefaultLauncherInfo(),
		...state.launcherInfo,
	};
	return {
		...launcherInfo,
		gacha_status: resolveGachaLauncherStatus(
			launcherInfo.gacha_status ?? releasedStatus,
			options?.hasActiveGacha ?? true,
		),
		circle_status:
			fanLevel >= circleUnlockFanLevel ? releasedStatus : notOpenStatus,
	};
}

function resolveGachaLauncherStatus(
	configuredStatus: number,
	hasActiveGacha: boolean,
): number {
	switch (configuredStatus) {
		case notOpenStatus:
		case maintenanceStatus:
		case liberationAnimeStatus:
			return configuredStatus;
		default:
			return hasActiveGacha ? releasedStatus : notOpenStatus;
	}
}
