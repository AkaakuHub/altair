import { expect, test } from 'bun:test';
import { loadStandaloneAdminOptions } from '../../packages/admin-server/src/configuration/standalone-admin-config.ts';

test('起動コマンドの引数を設定値から読む', () => {
	expect(
		loadStandaloneAdminOptions({
			RUNTIME_SWITCH_COMMAND: '["sample-dispatch","argument with spaces"]',
		}),
	).toEqual({
		runtimeSwitchCommand: ['sample-dispatch', 'argument with spaces'],
	});
	expect(
		loadStandaloneAdminOptions({
			RUNTIME_SWITCH_COMMAND: '["sample-dispatch"]',
		}),
	).toEqual({ runtimeSwitchCommand: ['sample-dispatch'] });
});

test('未設定・空・文字列のコマンドを拒否する', () => {
	for (const command of [
		undefined,
		'',
		'[]',
		'"sample-dispatch"',
		'[""]',
		'["sample-dispatch",""]',
	])
		expect(() =>
			loadStandaloneAdminOptions({ RUNTIME_SWITCH_COMMAND: command }),
		).toThrow();
});
