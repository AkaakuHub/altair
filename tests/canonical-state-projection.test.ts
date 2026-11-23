import { describe, expect, test } from 'bun:test';
import { projectCanonicalState } from '../src/application/canonical-state-projection.ts';

describe('canonical state projection', () => {
	test('hides unsupported definitions without changing canonical state', () => {
		const canonical = [
			{ definitionId: 10, progress: 1 },
			{ definitionId: 20, progress: 2 },
		];
		const before = structuredClone(canonical);
		const result = projectCanonicalState(canonical, {
			readDefinitionId: (entry) => entry.definitionId,
			isSupported: (definitionId) => definitionId === 10,
		});

		expect(result.visibleEntries).toEqual([{ definitionId: 10, progress: 1 }]);
		expect(result.hiddenDefinitionIds).toEqual([20]);
		expect(canonical).toEqual(before);
		const projectedEntry = result.visibleEntries[0];
		if (projectedEntry === undefined) {
			throw new Error('projected entry is missing');
		}
		projectedEntry.progress = 99;
		expect(canonical).toEqual(before);
	});

	test('restores hidden data when the target master supports it again', () => {
		const canonical = [
			{ definitionId: 10, progress: 1 },
			{ definitionId: 20, progress: 2 },
		];
		const oldMaster = projectCanonicalState(canonical, {
			readDefinitionId: (entry) => entry.definitionId,
			isSupported: (definitionId) => definitionId === 10,
		});
		const newMasterAgain = projectCanonicalState(canonical, {
			readDefinitionId: (entry) => entry.definitionId,
			isSupported: () => true,
		});

		expect(oldMaster.visibleEntries.map((entry) => entry.definitionId)).toEqual(
			[10],
		);
		expect(
			newMasterAgain.visibleEntries.map((entry) => entry.definitionId),
		).toEqual([10, 20]);
		expect(newMasterAgain.visibleEntries[1]?.progress).toBe(2);
	});
});
