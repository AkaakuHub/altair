import { describe, expect, test } from 'bun:test';
import {
	createKeyedControllerProvider,
	createWeakControllerProvider,
} from '../src/server-composition/controller-providers.ts';

describe('controller providers', () => {
	test('master release IDごとにcontrollerを1回だけ生成する', () => {
		let createCount = 0;
		const getController = createKeyedControllerProvider(
			(masterReleaseId: string) => {
				createCount += 1;
				return { masterReleaseId };
			},
		);

		const first = getController('release-a', 'release-a');
		expect(getController('release-a', 'unused')).toBe(first);
		expect(getController('release-b', 'release-b')).not.toBe(first);
		expect(createCount).toBe(2);
	});

	test('database objectごとにcontrollerを1回だけ生成する', () => {
		let createCount = 0;
		const getController = createWeakControllerProvider((database: object) => {
			createCount += 1;
			return { database };
		});
		const databaseA = {};
		const databaseB = {};

		const first = getController(databaseA);
		expect(getController(databaseA)).toBe(first);
		expect(getController(databaseB)).not.toBe(first);
		expect(createCount).toBe(2);
	});
});
