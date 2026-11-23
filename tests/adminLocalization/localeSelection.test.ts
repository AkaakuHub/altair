import { expect, test } from 'bun:test';
import { resolveAdminLocale } from '../../packages/admin-ui/src/i18n/messages.ts';

test('保存した言語を端末の言語より優先する', () => {
	expect(resolveAdminLocale('ko', ['ja-JP'])).toBe('ko');
	expect(resolveAdminLocale('zh-CN', ['en-US'])).toBe('zh-CN');
});

test('未選択の端末は対応する言語を希望順に選ぶ', () => {
	expect(resolveAdminLocale(null, ['fr-FR', 'en-GB', 'ja-JP'])).toBe('en');
	expect(resolveAdminLocale(null, ['zh-Hans-CN'])).toBe('zh-CN');
	expect(resolveAdminLocale(null, ['ko-KR'])).toBe('ko');
	expect(resolveAdminLocale(null, ['ja-JP'])).toBe('ja');
});

test('対応しない保存値は端末設定に従い、対応言語がなければ日本語で開始する', () => {
	expect(resolveAdminLocale('fr', ['en-US'])).toBe('en');
	expect(resolveAdminLocale(null, ['fr-FR'])).toBe('ja');
	expect(resolveAdminLocale(null, [])).toBe('ja');
});
