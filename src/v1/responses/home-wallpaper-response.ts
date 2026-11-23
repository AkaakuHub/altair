import {
	homeDetailWallpaperSettingId,
	homeSimpleWallpaperSettingId,
	type UserProfileSettingsState,
} from '../../state/profile-settings-state.ts';

type HomeGetWallpaperSettingResponse = {
	current_home_wall_paper_settings_id: string;
	wall_paper_setting_list: WallpaperSetting[];
};

type WallpaperSetting = {
	d_home_wall_paper_settings_id: string;
	wallpaper_setting_info: string;
};

export function createHomeGetWallpaperSettingResponse(
	settings: UserProfileSettingsState,
): HomeGetWallpaperSettingResponse {
	return {
		current_home_wall_paper_settings_id: settings.isViewDetailWallpaper
			? homeDetailWallpaperSettingId
			: homeSimpleWallpaperSettingId,
		wall_paper_setting_list: [
			createWallpaperSetting(settings, homeDetailWallpaperSettingId, true),
			createWallpaperSetting(settings, homeSimpleWallpaperSettingId, false),
		],
	};
}

function createWallpaperSetting(
	settings: UserProfileSettingsState,
	settingId: string,
	isViewDetailWallpaper: boolean,
): WallpaperSetting {
	return {
		d_home_wall_paper_settings_id: settingId,
		wallpaper_setting_info: JSON.stringify({
			wallpaper_detail_setting_info: settings.wallpaperDetailSettingInfo,
			wallpaper_simple_setting_info: settings.wallpaperSimpleSettingInfo,
			is_view_detail_wallpaper: isViewDetailWallpaper,
			before_clock_setting_info: settings.beforeClockSettingInfo,
			after_clock_setting_info: settings.afterClockSettingInfo,
		}),
	};
}
