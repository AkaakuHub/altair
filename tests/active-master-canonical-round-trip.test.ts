import { describe, expect, test } from 'bun:test';
import {
	type ActiveMasterIdentity,
	projectCanonicalStateForActiveMaster,
} from '../src/application/active-master-canonical-projection.ts';

const fingerprintA = { domain: 'music', value: '[1,"version-a"]' };
const fingerprintB = { domain: 'music', value: '[1,"version-b"]' };

const masterA: ActiveMasterIdentity = {
	releaseId: 'release-a',
	databaseFingerprint: 'database-a',
	entityFingerprints: new Map([[1, fingerprintA]]),
};
const masterB: ActiveMasterIdentity = {
	releaseId: 'release-b',
	databaseFingerprint: 'database-b',
	entityFingerprints: new Map([[1, fingerprintB]]),
};

describe('active master canonical state round trip', () => {
	test('A→B→A→Bで非対応entryを削除せず、identityが一致するentryだけを復元する', () => {
		const canonical = [
			{
				definitionId: 1,
				sourceMasterReleaseId: masterA.releaseId,
				identityFingerprint: fingerprintA,
				progress: 100,
			},
		];
		const originalA = structuredClone(canonical);

		const firstA = projectCanonicalStateForActiveMaster(canonical, masterA);
		expect(firstA.visibleEntries.map((entry) => entry.progress)).toEqual([100]);

		const firstB = projectCanonicalStateForActiveMaster(canonical, masterB);
		expect(firstB.visibleEntries).toEqual([]);
		expect(firstB.hiddenEntries).toHaveLength(1);
		expect(canonical).toEqual(originalA);

		canonical.push({
			definitionId: 1,
			sourceMasterReleaseId: masterB.releaseId,
			identityFingerprint: fingerprintB,
			progress: 200,
		});
		const canonicalWithB = structuredClone(canonical);

		const secondA = projectCanonicalStateForActiveMaster(canonical, masterA);
		expect(secondA.visibleEntries.map((entry) => entry.progress)).toEqual([
			100,
		]);
		expect(secondA.hiddenEntries.map((entry) => entry.progress)).toEqual([200]);
		expect(canonical).toEqual(canonicalWithB);

		const secondB = projectCanonicalStateForActiveMaster(canonical, masterB);
		expect(secondB.visibleEntries.map((entry) => entry.progress)).toEqual([
			200,
		]);
		expect(secondB.hiddenEntries.map((entry) => entry.progress)).toEqual([100]);
		expect(secondB.activeMaster).toEqual({
			releaseId: masterB.releaseId,
			databaseFingerprint: masterB.databaseFingerprint,
		});
		expect(canonical).toEqual(canonicalWithB);
	});
});
