import type {
	CircleCreateApiInput,
	CircleSettingApiInput,
} from '../../state/circle-types.ts';
import { isRecord } from '../../state/json-state-utils.ts';
import type { CircleChatLogListConditions } from '../responses/circle-chat-response.ts';
import type { CircleSearchConditions } from '../responses/circle-directory-response.ts';
import { getNumberField } from './request-fields.ts';

export function isCircleCreateLocked(grandPrix: { endDate: string }): boolean {
	const endTime = Date.parse(grandPrix.endDate);
	return Number.isFinite(endTime) && Date.now() <= endTime;
}

export function readCircleCreateApiInput(body: unknown): CircleCreateApiInput {
	if (!isRecord(body) || typeof body.guild_setting !== 'string') {
		return createEmptyCircleCreateApiInput();
	}
	return readCircleCreateApiInputFromGuildSetting(body.guild_setting);
}

export function readCircleSettingApiInput(
	body: unknown,
): CircleSettingApiInput {
	if (!isRecord(body) || typeof body.guild_setting !== 'string') {
		return { ...createEmptyCircleCreateApiInput(), searchGuildKey: '' };
	}
	return {
		...readCircleCreateApiInputFromGuildSetting(body.guild_setting),
		searchGuildKey: readString(body.search_guild_key),
	};
}

function readCircleCreateApiInputFromGuildSetting(
	guildSettingText: string,
): CircleCreateApiInput {
	const guildSetting = JSON.parse(guildSettingText) as unknown;
	if (!isRecord(guildSetting)) {
		return createEmptyCircleCreateApiInput();
	}
	return {
		guildName: readString(guildSetting.guild_name),
		guildComment: readString(guildSetting.guild_comment),
		guildPolicyAction: readNumber(guildSetting.guild_policy_action),
		guildPolicyRecruiting: readNumber(guildSetting.guild_policy_recruiting),
		guildIconPartsInfo: minifyJsonText(
			readString(guildSetting.guild_icon_parts_info),
		),
	};
}

export function readStringField(body: unknown, key: string): string {
	if (!isRecord(body)) {
		return '';
	}
	return readString(body[key]);
}

export function readNumberField(body: unknown, key: string): number {
	return getNumberField(body, key) ?? 0;
}

export function readCircleSearchConditions(
	body: unknown,
): CircleSearchConditions {
	if (!isRecord(body) || typeof body.search_conditions !== 'string') {
		return createEmptyCircleSearchConditions();
	}
	const parsed = JSON.parse(body.search_conditions) as unknown;
	if (!isRecord(parsed)) {
		return createEmptyCircleSearchConditions();
	}
	return {
		guildName: readString(parsed.guild_name),
		guildMemberNum: readNullableNumber(parsed.guild_member_num),
		guildPolicyAction: readNullableNumber(parsed.guild_policy_action),
		guildPolicyRecruiting: readNullableNumber(parsed.guild_policy_recruiting),
		pageNum: readNumber(parsed.page_num),
	};
}

export function readCircleChatLogListConditions(
	url: string,
): CircleChatLogListConditions {
	const params = new URL(url, 'http://localhost').searchParams;
	return {
		diffOrderId: readNullableNumberText(params.get('diff_order_id')),
	};
}

function createEmptyCircleCreateApiInput(): CircleCreateApiInput {
	return {
		guildName: '',
		guildComment: '',
		guildPolicyAction: 0,
		guildPolicyRecruiting: 0,
		guildIconPartsInfo: '',
	};
}

function readString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function readNumber(value: unknown): number {
	return typeof value === 'number' ? value : 0;
}

function createEmptyCircleSearchConditions(): CircleSearchConditions {
	return {
		guildName: '',
		guildMemberNum: null,
		guildPolicyAction: null,
		guildPolicyRecruiting: null,
		pageNum: 0,
	};
}

function readNullableNumber(value: unknown): number | null {
	return typeof value === 'number' ? value : null;
}

function readNullableNumberText(value: string | null): number | null {
	if (value === null || value.trim().length === 0) {
		return null;
	}
	const parsed = Number(value);
	return Number.isInteger(parsed) ? parsed : null;
}

function minifyJsonText(value: string): string {
	if (value.length === 0) {
		return '';
	}
	return JSON.stringify(JSON.parse(value));
}
