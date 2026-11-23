import { Database } from 'bun:sqlite';
import { expect, test } from 'bun:test';
import type { ActiveMasterSelection } from '../../src/master-data/active-master-repository.ts';
import { createMasterSelectionResolvers } from '../../src/server-composition/master-selection-resolvers.ts';

test('Adminで選択した利用者のOSと、保存されたmaster参照に対応するDBを使う', () => {
	const android = new Database(':memory:');
	const ios = new Database(':memory:');
	try {
		let selected: 'android' | 'ios' = 'android';
		const selection: ActiveMasterSelection = {
			releaseId: 'c'.repeat(64),
			databaseFingerprint: 'd'.repeat(64),
			androidResourceVersion: 'R2606002@sample',
			iosResourceVersion: 'R2606100@sample',
			database: android,
			platforms: {
				android: {
					masterReleaseId: 'a'.repeat(64),
					clientVersion: '5.1.0',
					database: android,
				},
				ios: {
					masterReleaseId: 'b'.repeat(64),
					clientVersion: '6.0.0',
					database: ios,
				},
			},
		};
		const resolver = createMasterSelectionResolvers(selection, (playerId) =>
			playerId === 'android' || playerId === 'ios' ? playerId : selected,
		);
		expect(resolver.resolveCurrent()).toBe(android);
		selected = 'ios';
		expect(resolver.resolveCurrent()).toBe(ios);
		expect(resolver.resolveSelectedAdminUser()).toBe(ios);
		expect(resolver.resolveAdminUser('android')).toBe(android);
		expect(resolver.resolveAdminUserSelection('ios')).toMatchObject({
			masterReleaseId: 'b'.repeat(64),
			database: ios,
		});
		expect(resolver.resolveActiveRelease('a'.repeat(64))).toBe(android);
		expect(resolver.resolveActiveRelease('b'.repeat(64))).toBe(ios);
		expect(resolver.resolveActiveRelease(selection.releaseId)).toBe(android);
		expect(() => resolver.resolveActiveRelease('e'.repeat(64))).toThrow(
			'active master release differs',
		);
	} finally {
		android.close();
		ios.close();
	}
});
