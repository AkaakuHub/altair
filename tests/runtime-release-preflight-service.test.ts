import { describe, expect, test } from 'bun:test';
import {
	preflightRuntimeRelease,
	type RuntimeReleasePreflightDependencies,
} from '../src/application/runtime-release/runtime-release-preflight-service.ts';

const androidResourceVersion = 'R2607003@android=';
const iosResourceVersion = 'R2607003@ios=';

describe('runtime release preflight service', () => {
	test('単一active databaseでAndroidとiOSの選択releaseを検証する', () => {
		let inspected = 0;
		let closed = false;
		const dependencies: RuntimeReleasePreflightDependencies = {
			readResourceVersions: () => ({
				android: { '5.1.0': [androidResourceVersion] },
				ios: { '5.1.0': [iosResourceVersion] },
			}),
			openActiveMaster: () => ({
				selection: {
					releaseId: 'active-release',
					androidResourceVersion,
					iosResourceVersion,
					database: 'one-active-database',
				},
				close: () => {
					closed = true;
				},
			}),
			inspectMasterDatabase: () => {
				inspected += 1;
				return {
					musicIds: [900001],
					stories: [{ advSeriesId: 990001, advDataIds: [99000101] }],
				};
			},
		};

		const result = preflightRuntimeRelease(
			{
				resourceVersionRegistryRoot: '/release/resource-version-registry',
				activeMasterDatabasePath: '/release/active.sqlite',
				selectedMasterReleasePath: '/release/selected-release.json',
				clientVersion: '5.1.0',
				revision: 'R2607003',
				expectations: {
					music: { musicId: 900001 },
					story: { advSeriesId: 990001, advDataId: 99000101 },
				},
			},
			dependencies,
		);

		expect(result.platforms).toEqual([
			{
				platform: 'android',
				resourceVersion: androidResourceVersion,
				masterReleaseId: 'active-release',
			},
			{
				platform: 'ios',
				resourceVersion: iosResourceVersion,
				masterReleaseId: 'active-release',
			},
		]);
		expect(inspected).toBe(1);
		expect(closed).toBe(true);
	});

	test('selected releaseとregistryが異なる場合は内容を読まず失敗する', () => {
		let inspected = false;
		const dependencies: RuntimeReleasePreflightDependencies = {
			readResourceVersions: () => ({
				android: { '5.1.0': [androidResourceVersion] },
				ios: { '5.1.0': [iosResourceVersion] },
			}),
			openActiveMaster: () => ({
				selection: {
					releaseId: 'active-release',
					androidResourceVersion: 'R2607002@android=',
					iosResourceVersion,
					database: 'one-active-database',
				},
				close: () => {},
			}),
			inspectMasterDatabase: () => {
				inspected = true;
				return { musicIds: [], stories: [] };
			},
		};

		expect(() =>
			preflightRuntimeRelease(
				{
					resourceVersionRegistryRoot: '/release/resource-version-registry',
					activeMasterDatabasePath: '/release/active.sqlite',
					selectedMasterReleasePath: '/release/selected-release.json',
					clientVersion: '5.1.0',
					revision: 'R2607003',
					expectations: { music: { musicId: 900001 } },
				},
				dependencies,
			),
		).toThrow('android active resource version differs from registry');
		expect(inspected).toBe(false);
	});
});
