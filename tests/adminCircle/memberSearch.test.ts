import { expect, test } from 'bun:test';
import { adminLocales } from '../../packages/admin-ui/src/i18n/messages.ts';
import {
	createMemberRows,
	filterCircleMembers,
} from '../../packages/admin-ui/src/ui/features/circle/circle-model.ts';

test('各言語の役職名でメンバーを検索し、保存した役職値を維持する', () => {
	const circle = {
		members: [
			{ playerId: 'player-a', positionType: 0 },
			{ playerId: 'player-b', positionType: 1 },
			{ playerId: 'player-c', positionType: 2 },
			{ playerId: 'player-d', positionType: 8 },
		],
	};
	const snapshot = structuredClone(circle);
	for (const { messages } of Object.values(adminLocales)) {
		const rows = createMemberRows(circle, [], messages.circle);
		const leaders = filterCircleMembers(
			rows,
			messages.circle.leader.toUpperCase(),
		);
		expect(leaders.some((row) => row.playerId === 'player-b')).toBe(true);
		expect(filterCircleMembers(rows, messages.circle.subleader)).toEqual([
			expect.objectContaining({ playerId: 'player-c' }),
		]);
		expect(filterCircleMembers(rows, '8')).toEqual([
			expect.objectContaining({
				playerId: 'player-d',
				positionType: 8,
				positionLabel: '8',
			}),
		]);
		expect(filterCircleMembers(rows, 'PLAYER-A')).toEqual([
			expect.objectContaining({ playerId: 'player-a' }),
		]);
		expect(filterCircleMembers(rows, ' ')).toBe(rows);
	}
	expect(circle).toEqual(snapshot);
});
