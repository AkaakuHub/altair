import { afterAll, expect, test } from 'bun:test';
import { openSqliteActiveMasterRepository } from '../../src/master-data/sqlite-active-master-repository.ts';
import type { ServerState } from '../../src/server-state-schema.ts';
import { ensureCurrentSeasonFanLevel } from '../../src/state/season-fan-level-current-aggregate.ts';
import type { WithstationCommentResponse } from '../../src/v1/response-types/withstation-response-types.ts';
import { createReferenceStateStore } from '../serverComposition/fixtures/referenceStateStore.ts';
import {
	config,
	createTestApp,
	postJson,
	registerNewUser,
} from '../test-app.ts';

const liveId = '5193544d-cf77-4dfa-8071-db73c9d81cc1';
const repository = openSqliteActiveMasterRepository(
	config.activeMasterDatabasePath,
	config.selectedMasterReleasePath,
);
afterAll(() => repository.close());

test('Stationのコメント送信がアプリ共通表示に必要な本文・色・IDを返し、不正な要求でstateを保存しない', async () => {
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
	await registerNewUser(app);
	const state = reference.current;
	if (!state) throw new Error('state missing');
	for (const status of state.userStatuses) ensureCurrentSeasonFanLevel(status);
	const before = structuredClone(state);
	writes = 0;
	const comment = 'こんにちは！🎉「Station」';
	const response = await postJson(app, '/v1/withstation/comment', {
		live_id: liveId,
		comment,
		play_time_ms: 12345,
	});
	expect(response.status).toBe(200);
	const body = (await response.json()) as WithstationCommentResponse;
	expect(body).toEqual({
		timeline_id: expect.any(String),
		comment,
		name_color: '#FFFFFFFF',
		text_color: '#FFFFFFFF',
		background_color: '#00000000',
		timeline_time_ms: 12345,
	});
	expect(body.timeline_id.length).toBeGreaterThan(0);
	const initial = await postJson(app, '/v1/withstation/comment', {
		live_id: liveId,
		comment,
	});
	expect(initial.status).toBe(200);
	const initialBody = (await initial.json()) as {
		timeline_id: string;
		timeline_time_ms: number;
	};
	expect(initialBody.timeline_time_ms).toBe(0);
	expect(initialBody.timeline_id).not.toBe(body.timeline_id);
	for (const invalid of [
		{ live_id: 'missing', comment },
		{ live_id: liveId, comment: '' },
		{ live_id: liveId, comment: 123 },
		{ live_id: liveId, comment, play_time_ms: -1 },
		{ live_id: liveId, comment, play_time_ms: 1.5 },
		{ live_id: liveId, comment, play_time_ms: '1000' },
		{ live_id: liveId, comment, play_time_ms: Number.MAX_SAFE_INTEGER + 1 },
	]) {
		const invalidResponse = await postJson(
			app,
			'/v1/withstation/comment',
			invalid,
		);
		expect(invalidResponse.status).not.toBe(200);
	}
	const unauthenticated = await postJson(
		app,
		'/v1/withstation/comment',
		{ live_id: liveId, comment },
		{ authorization: 'Bearer invalid' },
	);
	expect(unauthenticated.status).toBe(401);
	expect(writes).toBe(0);
	expect(state).toEqual(before);
});
