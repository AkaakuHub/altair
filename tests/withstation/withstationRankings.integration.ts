import { afterAll, expect, test } from 'bun:test';
import { getGiftLiveProvenance } from '../../src/master-data/archive-identity.ts';
import { openSqliteActiveMasterRepository } from '../../src/master-data/sqlite-active-master-repository.ts';
import type { ServerState } from '../../src/server-state-schema.ts';
import { addArchiveGiftPoint } from '../../src/state/archive-gift-state.ts';
import { ensureCurrentSeasonFanLevel } from '../../src/state/season-fan-level-current-aggregate.ts';
import { createReferenceStateStore } from '../serverComposition/fixtures/referenceStateStore.ts';
import {
	authHeaders,
	config,
	createTestApp,
	registerNewUser,
} from '../test-app.ts';

const liveId = '5193544d-cf77-4dfa-8071-db73c9d81cc1';
const repository = openSqliteActiveMasterRepository(
	config.activeMasterDatabasePath,
	config.selectedMasterReleasePath,
);
afterAll(() => repository.close());

test('Stationの順位を本人の累計とアイコンへ接続し、別の配信・masterのポイントを混ぜず読み取りで保存しない', async () => {
	const reference: { current?: ServerState } = {};
	const base = createReferenceStateStore(reference);
	let writes = 0;
	const app = createTestApp({
		activeMasterRepository: repository,
		stateStore: {
			...base,
			write: (state: ServerState) => {
				writes++;
				base.write(state);
			},
		},
	});
	const first = await registerNewUser(app);
	const second = await registerNewUser(app);
	const observer = await registerNewUser(app);
	const state = reference.current;
	if (!state) throw new Error('state missing');
	const provenance = getGiftLiveProvenance(
		repository.selection.database,
		repository.selection.releaseId,
		'withstation',
		liveId,
	);
	if (!provenance) throw new Error('provenance missing');
	for (const [playerId, point] of [
		[first.player_id, 100],
		[second.player_id, 200],
		[observer.player_id, 0],
	] as const) {
		state.archiveGiftPoints = addArchiveGiftPoint(
			state.archiveGiftPoints,
			playerId,
			liveId,
			point,
			true,
			provenance,
		).giftPoints;
	}
	const firstPoint = state.archiveGiftPoints[0];
	if (!firstPoint) throw new Error('point missing');
	state.archiveGiftPoints.push(
		{
			...firstPoint,
			totalUserGiftPoint: 99999,
			identityFingerprint: {
				...provenance.identityFingerprint,
				value: 'different-master',
			},
		},
		{ ...firstPoint, totalUserGiftPoint: 99999, liveId: 'another-station' },
	);
	for (const status of state.userStatuses) ensureCurrentSeasonFanLevel(status);
	const before = structuredClone(state);
	writes = 0;
	const firstResponse = await app.request(
		`/v1/withstation/gift_pt_rankings?live_id=${liveId}`,
		{ headers: authHeaders(first.session_token) },
	);
	expect(firstResponse.status).toBe(200);
	expect(await firstResponse.json()).toMatchObject({
		gift_pt_rankings: [
			{ user_id: second.player_id, ranking: 1, gift_pt: 200 },
			{ user_id: first.player_id, ranking: 2, gift_pt: 100 },
		],
		user_gift_pt: 100,
		user_gift_pt_ranking: 2,
		total_gift_pt: '300',
		polling_interval: 1,
	});
	const observerResponse = await app.request(
		`/v1/withstation/gift_pt_rankings?live_id=${liveId}`,
		{ headers: authHeaders(observer.session_token) },
	);
	expect(await observerResponse.json()).toMatchObject({
		user_gift_pt: 0,
		user_gift_pt_ranking: 0,
	});
	const missing = await app.request(
		'/v1/withstation/gift_pt_rankings?live_id=missing',
	);
	expect(missing.status).toBe(404);
	expect(writes).toBe(0);
	expect(state).toEqual(before);
});
