import { randomUUID } from 'node:crypto';
import type { ServerState } from '../server-state-schema.ts';
import { isCircleMember } from './circle-member-state.ts';
import type { CircleState } from './circle-types.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import { isRecord } from './json-state-utils.ts';
import { jsonStringToOfficialResponseJson } from './official-json-values.ts';

type ProfileDesignType = 1 | 2;

export type ProfileDesignEntry = {
	d_profile_my_designs_id: string;
	is_setting: boolean;
	my_design_name: string;
	my_design_parts_info: string;
	my_design_type: ProfileDesignType;
};

export type ProfileCircleInfo = {
	searchGuildKey: string;
	guildName: string;
};

export function createProfileCircleInfo(
	circle: CircleState | null,
	playerId: string,
): ProfileCircleInfo {
	if (!isCircleMember(circle, playerId)) {
		return { searchGuildKey: '', guildName: '' };
	}
	if (circle === null) {
		throw new Error(`profile circle is missing for member: ${playerId}`);
	}
	return {
		searchGuildKey: circle.searchGuildKey,
		guildName: circle.guildName,
	};
}

export const PROFILE_FRIEND_REQUEST_STATUS_NOT_REQUESTED = 0;
export const PROFILE_FRIEND_REQUEST_STATUS_REQUESTABLE = 1;
export const PROFILE_FRIEND_REQUEST_STATUS_ALREADY_FRIEND = 4;
export const PROFILE_FOLLOW_STATUS_NOT_FOLLOWING = 0;
export const PROFILE_FOLLOW_STATUS_FOLLOWING = 1;
export type ProfileFriendRequestStatus =
	| typeof PROFILE_FRIEND_REQUEST_STATUS_NOT_REQUESTED
	| typeof PROFILE_FRIEND_REQUEST_STATUS_REQUESTABLE
	| typeof PROFILE_FRIEND_REQUEST_STATUS_ALREADY_FRIEND;
export type ProfileFollowStatus =
	| typeof PROFILE_FOLLOW_STATUS_NOT_FOLLOWING
	| typeof PROFILE_FOLLOW_STATUS_FOLLOWING;

export type UserProfileDesignState = {
	playerId: string;
	cardDesignList: ProfileDesignEntry[];
	iconDesignList: ProfileDesignEntry[];
};

export function ensureUserProfileDesign(
	state: Pick<ServerState, 'userProfileDesigns'>,
	playerId: string,
): EnsureStateResult<UserProfileDesignState> {
	const existing = state.userProfileDesigns.find(
		(design) => design.playerId === playerId,
	);
	if (existing) {
		return { value: existing, created: false };
	}
	const design = {
		playerId,
		cardDesignList: createDefaultDesignList(1),
		iconDesignList: createDefaultDesignList(2),
	};
	state.userProfileDesigns = [...state.userProfileDesigns, design];
	return { value: design, created: true };
}

export function updateProfileDesignEntry(
	design: UserProfileDesignState,
	designType: ProfileDesignType,
	designId: string,
	partsInfo: string,
	myDesignName: string,
): boolean {
	const designList = designListByType(design, designType);
	const entry = designList.find(
		(item) => item.d_profile_my_designs_id === designId,
	);
	if (!entry) {
		return false;
	}
	setDesignListByType(
		design,
		designType,
		designList.map((item) =>
			item.d_profile_my_designs_id === designId
				? {
						...item,
						my_design_name: myDesignName,
						my_design_parts_info: partsInfo,
					}
				: item,
		),
	);
	return true;
}

export function setProfileDesignSelection(
	design: UserProfileDesignState,
	designType: ProfileDesignType,
	designId: string,
): boolean {
	const designList = designListByType(design, designType);
	if (!designList.some((item) => item.d_profile_my_designs_id === designId)) {
		return false;
	}
	setDesignListByType(
		design,
		designType,
		designList.map((item) => ({
			...item,
			is_setting: item.d_profile_my_designs_id === designId,
		})),
	);
	return true;
}

function getSelectedProfileDesignPartsInfo(
	design: UserProfileDesignState,
	designType: ProfileDesignType,
): string {
	return selectedDesignPartsInfo(designListByType(design, designType));
}

export function getSelectedProfileDesignPartsInfoForOfficialResponse(
	design: UserProfileDesignState,
	designType: ProfileDesignType,
): string {
	return jsonStringToOfficialResponseJson(
		getSelectedProfileDesignPartsInfo(design, designType),
	);
}

function createDefaultDesignList(
	myDesignType: ProfileDesignType,
): ProfileDesignEntry[] {
	return Array.from({ length: 10 }, (_, index) => ({
		d_profile_my_designs_id: randomUUID(),
		is_setting: index === 0,
		my_design_name: `カスタム${index + 1}`,
		my_design_parts_info: '{}',
		my_design_type: myDesignType,
	}));
}

function selectedDesignPartsInfo(designList: ProfileDesignEntry[]): string {
	const selectedDesign = designList.find((design) => design.is_setting);
	if (selectedDesign === undefined) {
		throw new Error('Profile design state has no selected design');
	}
	return selectedDesign.my_design_parts_info;
}

function designListByType(
	design: UserProfileDesignState,
	designType: ProfileDesignType,
): ProfileDesignEntry[] {
	return designType === 1 ? design.cardDesignList : design.iconDesignList;
}

function setDesignListByType(
	design: UserProfileDesignState,
	designType: ProfileDesignType,
	designList: ProfileDesignEntry[],
): void {
	if (designType === 1) {
		design.cardDesignList = designList;
		return;
	}
	design.iconDesignList = designList;
}

export function isUserProfileDesignState(
	value: unknown,
): value is UserProfileDesignState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.playerId === 'string' &&
		Array.isArray(value.cardDesignList) &&
		value.cardDesignList.every(isProfileDesignEntry) &&
		Array.isArray(value.iconDesignList) &&
		value.iconDesignList.every(isProfileDesignEntry)
	);
}

function isProfileDesignEntry(value: unknown): value is ProfileDesignEntry {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.d_profile_my_designs_id === 'string' &&
		typeof value.is_setting === 'boolean' &&
		typeof value.my_design_name === 'string' &&
		typeof value.my_design_parts_info === 'string' &&
		(value.my_design_type === 1 || value.my_design_type === 2)
	);
}
