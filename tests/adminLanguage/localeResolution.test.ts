import { expect, test } from 'bun:test';
import {
	isAdminLocale,
	resolveAdminLocale,
} from '../../packages/admin-ui/src/i18n/messages.ts';

test('保存した言語をブラウザーの優先言語より優先する', () => {
	expect(resolveAdminLocale('ko', ['en-US', 'ja'])).toBe('ko');
});
test('ブラウザーの地域付き言語を登録した言語へ解決する', () => {
	expect(resolveAdminLocale(null, ['fr-FR', 'en-US', 'ja'])).toBe('en');
	expect(resolveAdminLocale(null, ['ZH-cn'])).toBe('zh-CN');
	expect(resolveAdminLocale(null, ['zh-TW'])).toBe('zh-CN');
	expect(resolveAdminLocale(null, ['ko-KR'])).toBe('ko');
});
test('未登録の保存値とprototypeの名前を言語として扱わない', () => {
	expect(isAdminLocale('constructor')).toBe(false);
	expect(isAdminLocale('__proto__')).toBe(false);
	expect(resolveAdminLocale('constructor', ['en-GB'])).toBe('en');
	expect(resolveAdminLocale(null, ['fr-FR'])).toBe('ja');
});
