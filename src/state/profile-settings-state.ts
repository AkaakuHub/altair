import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isRecord } from './json-state-utils.ts';
import { OFFICIAL_EMPTY_STRING_JSON } from './official-json-values.ts';

export type UserProfileSettingsState = {
	playerId: string;
	displayCardDatasId: number | null;
	displayCardDataId: string;
	displayCardSourceMasterReleaseId?: string;
	displayCardIdentityFingerprint?: EntityIdentityFingerprint;
	comment: string;
	finishedSimpleTutorialIds: number[];
	wallpaperDetailSettingInfo: string;
	wallpaperSimpleSettingInfo: string;
	isViewDetailWallpaper: boolean;
	beforeClockSettingInfo: string;
	afterClockSettingInfo: string;
};

export const homeDetailWallpaperSettingId = 'home_detail_wallpaper';
export const homeSimpleWallpaperSettingId = 'home_simple_wallpaper';

export function findUserProfileSettings(
	state: { userProfileSettings: UserProfileSettingsState[] },
	playerId: string,
): UserProfileSettingsState | undefined {
	return state.userProfileSettings.find(
		(settings) => settings.playerId === playerId,
	);
}

export function ensureUserProfileSettings(
	state: Pick<ServerState, 'userProfileSettings'>,
	playerId: string,
): EnsureStateResult<UserProfileSettingsState> {
	const existing = findUserProfileSettings(state, playerId);
	if (existing) {
		return { value: existing, created: false };
	}
	const settings = {
		playerId,
		displayCardDatasId: null,
		displayCardDataId: '',
		comment: 'よろしくお願いします！',
		finishedSimpleTutorialIds: [],
		wallpaperDetailSettingInfo: OFFICIAL_EMPTY_STRING_JSON,
		wallpaperSimpleSettingInfo: OFFICIAL_EMPTY_STRING_JSON,
		isViewDetailWallpaper: false,
		beforeClockSettingInfo: '',
		afterClockSettingInfo: '',
	};
	state.userProfileSettings = [...state.userProfileSettings, settings];
	return { value: settings, created: true };
}

export function setHomeWallpaperSetting(
	settings: UserProfileSettingsState,
	body: unknown,
): boolean {
	if (!isRecord(body)) {
		return false;
	}
	const wallpaperDetailSettingInfo = body.wallpaper_detail_setting_info;
	const wallpaperSimpleSettingInfo = body.wallpaper_simple_setting_info;
	const isViewDetailWallpaper = body.is_view_detail_wallpaper;
	const beforeClockSettingInfo = body.before_clock_setting_info;
	const afterClockSettingInfo = body.after_clock_setting_info;
	if (
		typeof wallpaperDetailSettingInfo !== 'string' ||
		typeof wallpaperSimpleSettingInfo !== 'string' ||
		typeof isViewDetailWallpaper !== 'boolean' ||
		typeof beforeClockSettingInfo !== 'string' ||
		typeof afterClockSettingInfo !== 'string'
	) {
		return false;
	}
	settings.wallpaperDetailSettingInfo = wallpaperDetailSettingInfo;
	settings.wallpaperSimpleSettingInfo = wallpaperSimpleSettingInfo;
	settings.isViewDetailWallpaper = isViewDetailWallpaper;
	settings.beforeClockSettingInfo = beforeClockSettingInfo;
	settings.afterClockSettingInfo = afterClockSettingInfo;
	return true;
}

export function setCurrentHomeWallpaperSetting(
	settings: UserProfileSettingsState,
	settingId: unknown,
): boolean {
	if (settingId === homeDetailWallpaperSettingId) {
		settings.isViewDetailWallpaper = true;
		return true;
	}
	if (settingId === homeSimpleWallpaperSettingId) {
		settings.isViewDetailWallpaper = false;
		return true;
	}
	return false;
}

export function setSavedHomeWallpaperSetting(
	settings: UserProfileSettingsState,
	body: unknown,
): boolean {
	if (!isRecord(body)) {
		return false;
	}
	const settingId = body.d_home_wall_paper_settings_id;
	const wallpaperSettingInfo = body.wallpaper_setting_info;
	if (
		typeof settingId !== 'string' ||
		typeof wallpaperSettingInfo !== 'string'
	) {
		return false;
	}
	const parsedInfo = parseJson(wallpaperSettingInfo);
	if (setHomeWallpaperSetting(settings, parsedInfo)) {
		return setCurrentHomeWallpaperSetting(settings, settingId);
	}
	if (settingId === homeDetailWallpaperSettingId) {
		settings.wallpaperDetailSettingInfo = wallpaperSettingInfo;
		settings.isViewDetailWallpaper = true;
		return true;
	}
	if (settingId === homeSimpleWallpaperSettingId) {
		settings.wallpaperSimpleSettingInfo = wallpaperSettingInfo;
		settings.isViewDetailWallpaper = false;
		return true;
	}
	return false;
}

function parseJson(value: string): unknown {
	try {
		return JSON.parse(value) as unknown;
	} catch {
		return undefined;
	}
}

export function setSimpleTutorialFinished(
	settings: UserProfileSettingsState,
	contentsId: number,
	isFinished: boolean,
): boolean {
	if (!Number.isSafeInteger(contentsId) || contentsId <= 0) {
		return false;
	}
	const nextIds = new Set(settings.finishedSimpleTutorialIds);
	if (isFinished) {
		nextIds.add(contentsId);
	} else {
		nextIds.delete(contentsId);
	}
	settings.finishedSimpleTutorialIds = [...nextIds].sort(
		(left, right) => left - right,
	);
	return true;
}

export function isUserProfileSettingsState(
	value: unknown,
): value is UserProfileSettingsState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		(value.displayCardDatasId === null ||
			typeof value.displayCardDatasId === 'number') &&
		typeof value.displayCardDataId === 'string' &&
		(value.displayCardSourceMasterReleaseId === undefined ||
			typeof value.displayCardSourceMasterReleaseId === 'string') &&
		(value.displayCardIdentityFingerprint === undefined ||
			(isRecord(value.displayCardIdentityFingerprint) &&
				typeof value.displayCardIdentityFingerprint.domain === 'string' &&
				typeof value.displayCardIdentityFingerprint.value === 'string')) &&
		typeof value.comment === 'string' &&
		Array.isArray(value.finishedSimpleTutorialIds) &&
		value.finishedSimpleTutorialIds.every((item) => typeof item === 'number') &&
		typeof value.wallpaperDetailSettingInfo === 'string' &&
		typeof value.wallpaperSimpleSettingInfo === 'string' &&
		typeof value.isViewDetailWallpaper === 'boolean' &&
		typeof value.beforeClockSettingInfo === 'string' &&
		typeof value.afterClockSettingInfo === 'string'
	);
}
