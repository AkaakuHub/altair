import type {
	ProfileDesignEntry,
	UserProfileDesignState,
} from '../../../../../../src/state/profile-design-state.ts';
import {
	setCurrentHomeWallpaperSetting,
	setSavedHomeWallpaperSetting,
	type UserProfileSettingsState,
} from '../../../../../../src/state/profile-settings-state.ts';
import {
	type JsonRecord,
	readBoolean,
	readNumber,
	readNumberArray,
	readProfileInfo,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

export function createProfileSettingsFromResponses(
	playerId: string,
	customSettingResponse: JsonRecord | undefined,
	wallpaperResponse: JsonRecord | undefined,
	homeResponse: JsonRecord | undefined,
): UserProfileSettingsState | null {
	if (
		customSettingResponse === undefined &&
		wallpaperResponse === undefined &&
		homeResponse === undefined
	) {
		return null;
	}
	const profileInfo = readProfileInfo(customSettingResponse);
	const settings: UserProfileSettingsState = {
		playerId,
		displayCardDatasId:
			readNumber(customSettingResponse?.display_card_datas_id) ??
			readNumber(customSettingResponse?.display_card_data_id),
		displayCardDataId:
			readString(customSettingResponse?.d_card_datas_id) ??
			readString(customSettingResponse?.display_card_data_id) ??
			'',
		comment: readString(profileInfo?.comment) ?? 'よろしくお願いします！',
		finishedSimpleTutorialIds: readNumberArray(
			homeResponse?.finished_simple_tutorial_list,
		),
		wallpaperDetailSettingInfo: '""',
		wallpaperSimpleSettingInfo: '""',
		isViewDetailWallpaper: false,
		beforeClockSettingInfo: '',
		afterClockSettingInfo: '',
	};
	const currentWallpaperSettingId = readString(
		wallpaperResponse?.current_home_wall_paper_settings_id,
	);
	if (currentWallpaperSettingId !== null) {
		setCurrentHomeWallpaperSetting(settings, currentWallpaperSettingId);
	}
	for (const wallpaperSetting of readRecordArray(
		wallpaperResponse?.wall_paper_setting_list,
	)) {
		setSavedHomeWallpaperSetting(settings, wallpaperSetting);
	}
	return settings;
}

export function createProfileDesignFromResponses(
	playerId: string,
	cardDesignResponse: JsonRecord | undefined,
	iconDesignResponse: JsonRecord | undefined,
): UserProfileDesignState | null {
	if (cardDesignResponse === undefined && iconDesignResponse === undefined) {
		return null;
	}
	return {
		playerId,
		cardDesignList: readProfileDesignEntries(cardDesignResponse, 1),
		iconDesignList: readProfileDesignEntries(iconDesignResponse, 2),
	};
}

function readProfileDesignEntries(
	response: JsonRecord | undefined,
	designType: ProfileDesignEntry['my_design_type'],
): ProfileDesignEntry[] {
	return readRecordArray(response?.my_design_list)
		.map((entry) => createProfileDesignEntry(entry, designType))
		.filter((entry): entry is ProfileDesignEntry => entry !== null);
}

function createProfileDesignEntry(
	entry: JsonRecord,
	designType: ProfileDesignEntry['my_design_type'],
): ProfileDesignEntry | null {
	const designId = readString(entry.d_profile_my_designs_id);
	if (designId === null) {
		return null;
	}
	return {
		d_profile_my_designs_id: designId,
		is_setting: readBoolean(entry.is_setting),
		my_design_name: readString(entry.my_design_name) ?? '',
		my_design_parts_info: readString(entry.my_design_parts_info) ?? '{}',
		my_design_type: designType,
	};
}
