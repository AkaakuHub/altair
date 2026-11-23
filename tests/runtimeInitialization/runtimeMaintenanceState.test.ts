import { expect, test } from 'bun:test';
import { runtimeMaintenanceStateSchema } from '../../src/application/runtime-switch/runtime-maintenance-state.ts';

test('共通のメンテナンス設定は既存の型条件と余分な項目を取り除く動作を維持する', () => {
	const value = {
		schemaVersion: 1,
		enabled: false,
		androidResourceVersion: '',
		iosResourceVersion: '',
	} as const;
	expect(
		runtimeMaintenanceStateSchema.parse({ ...value, extra: 'ignored' }),
	).toEqual(value);
	for (const invalid of [
		null,
		[],
		{ ...value, enabled: 'false' },
		{ ...value, schemaVersion: 2 },
		{ ...value, iosResourceVersion: null },
	])
		expect(runtimeMaintenanceStateSchema.safeParse(invalid).success).toBe(
			false,
		);
});
