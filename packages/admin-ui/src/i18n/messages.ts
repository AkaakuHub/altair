import { enUS, jaJP, koKR, zhCN as muiZhCN } from '@mui/material/locale';
import { en } from './messages/en.ts';
import { ja } from './messages/ja.ts';
import { ko } from './messages/ko.ts';
import { zhCN } from './messages/zhCN.ts';

export type AdminMessages = typeof en;
export const adminLocales = {
	ja: { label: '日本語', messages: ja, mui: jaJP },
	en: { label: 'English', messages: en, mui: enUS },
	'zh-CN': { label: '简体中文', messages: zhCN, mui: muiZhCN },
	ko: { label: '한국어', messages: ko, mui: koKR },
} satisfies Record<
	string,
	{ label: string; messages: AdminMessages; mui: typeof enUS }
>;
export type AdminLocale = keyof typeof adminLocales;
export const adminLanguages = Object.entries(adminLocales).map(
	([locale, definition]) => ({
		locale: locale as AdminLocale,
		label: definition.label,
	}),
);

export function isAdminLocale(value: string | null): value is AdminLocale {
	return value !== null && Object.hasOwn(adminLocales, value);
}

export function resolveAdminLocale(
	stored: string | null,
	preferences: readonly string[],
): AdminLocale {
	if (isAdminLocale(stored)) return stored;
	for (const preference of preferences) {
		const normalized = preference.toLowerCase();
		const exact = adminLanguages.find(
			({ locale }) => locale.toLowerCase() === normalized,
		);
		if (exact !== undefined) return exact.locale;
		const language = normalized.split('-')[0];
		const related = adminLanguages.find(
			({ locale }) => locale.toLowerCase().split('-')[0] === language,
		);
		if (related !== undefined) return related.locale;
	}
	return 'ja';
}
