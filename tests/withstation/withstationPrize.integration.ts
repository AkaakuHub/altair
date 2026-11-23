import { afterAll, expect, test } from 'bun:test';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';
import { openSqliteActiveMasterRepository } from '../../src/master-data/sqlite-active-master-repository.ts';
import {
	type ServerState,
	serverStateSchema,
} from '../../src/server-state-schema.ts';
import { createSqliteServerStateStore } from '../../src/sqlite-server-state-store.ts';
import { createContractValidator } from '../../tools/apiDocumentation/contractValidation.ts';
import {
	authHeaders,
	config,
	createTestApp,
	postJson,
	registerNewUser,
} from '../test-app.ts';

const liveId = '5193544d-cf77-4dfa-8071-db73c9d81cc1';
const activeMasterRepository = openSqliteActiveMasterRepository(
	config.activeMasterDatabasePath,
	config.selectedMasterReleasePath,
);

afterAll(() => activeMasterRepository.close());

test('With×STATIONの報酬は所有するプレゼントへ配分を確定したときだけ付与し、再起動後も再受取を拒否する', async () => {
	const store = createSqliteServerStateStore(':memory:');
	const reference: { current?: ServerState } = {};
	const stateStore = {
		...store,
		write: (state: ServerState) => {
			reference.current = state;
			store.write(state);
		},
	};
	try {
		const app = createTestApp({ stateStore, activeMasterRepository });
		const document = createGameOpenApiDocument(app.routes);
		const validate = createContractValidator(document.components.schemas);
		const owner = await registerNewUser(app);
		const state = reference.current;
		if (state === undefined) throw new Error('state missing');
		const ownerStatus = state.userStatuses.find(
			(status) => status.playerId === owner.player_id,
		);
		if (ownerStatus === undefined) throw new Error('owner status missing');
		const initialJewelFree = ownerStatus.jewelFree;
		const prize = await app.request(`/v1/withstation/prize?live_id=${liveId}`);
		expect(prize.status).toBe(200);
		const prizeSchema =
			document.paths['/v1/withstation/prize']?.get?.responses['200']?.content?.[
				'application/json'
			].schema;
		if (prizeSchema === undefined)
			throw new Error('WithSTATION prize contract missing');
		validate(prizeSchema, await prize.clone().json());
		expect(ownerStatus.jewelFree).toBe(initialJewelFree);
		const presentBox = state.userPresentBoxes.find(
			(box) => box.playerId === owner.player_id,
		);
		const present = presentBox?.presentList.find(
			(item) => item.live_id === liveId,
		);
		if (present === undefined || presentBox === undefined)
			throw new Error('prize present missing');
		expect(present.withstationPlaybackReward).toBe(true);
		const presentBoxId = present.d_present_boxes_id;
		const previewPath = `/v1/withstation/prize?present_box_id=${presentBoxId}`;
		const listResponse = await postJson(app, '/v1/present_box/get_list', {
			page: 1,
		});
		const list = (await listResponse.json()) as {
			items: Array<{ d_present_boxes_id: string }>;
		};
		const listedPresent = list.items.find(
			(item) => item.d_present_boxes_id === presentBoxId,
		);
		expect(listedPresent).toBeDefined();
		expect(listedPresent).not.toHaveProperty('withstationPlaybackReward');
		expect((await app.request(previewPath)).status).toBe(200);
		expect(
			(await app.request(`${previewPath}&live_id=another-live`)).status,
		).not.toBe(200);
		expect(ownerStatus.jewelFree).toBe(initialJewelFree);

		const viewer = await registerNewUser(app);
		const viewerStatus = state.userStatuses.find(
			(status) => status.playerId === viewer.player_id,
		);
		const viewerBefore = structuredClone(viewerStatus);
		const viewerBoxesBefore = structuredClone(
			state.userPresentBoxes.filter((box) => box.playerId === viewer.player_id),
		);
		expect((await app.request(previewPath)).status).not.toBe(200);
		expect(
			(
				await postJson(app, '/v1/withstation/set_star', {
					present_box_id: presentBoxId,
					set_star_json: starAllocation(1041, 1),
				})
			).status,
		).not.toBe(200);
		expect(viewerStatus?.jewelFree).toBe(viewerBefore?.jewelFree);
		expect(viewerStatus?.memberFanLevels).toEqual(
			viewerBefore?.memberFanLevels,
		);
		expect(
			state.userPresentBoxes.filter((box) => box.playerId === viewer.player_id),
		).toEqual(viewerBoxesBefore);
		expect(presentBox.presentList).toContain(present);

		const ownerHeaders = authHeaders(owner.session_token);
		const ownerBefore = structuredClone(ownerStatus);
		const giftPointsBefore = structuredClone(state.archiveGiftPoints);
		for (const [characterId, starNum] of [
			[1021, 1],
			[9999, 1],
			[1041, 2],
		] as const) {
			expect(
				(
					await postJson(
						app,
						'/v1/withstation/set_star',
						{
							present_box_id: presentBoxId,
							set_star_json: starAllocation(characterId, starNum),
						},
						ownerHeaders,
					)
				).status,
			).not.toBe(200);
			expect(ownerStatus).toEqual(ownerBefore);
			expect(state.archiveGiftPoints).toEqual(giftPointsBefore);
			expect(presentBox.presentList).toContain(present);
		}
		const request = {
			present_box_id: presentBoxId,
			set_star_json: starAllocation(1041, 1),
		};
		const receipt = await postJson(
			app,
			'/v1/withstation/set_star',
			request,
			ownerHeaders,
		);
		expect(receipt.status).toBe(200);
		expect(await receipt.json()).toEqual({ result: true });
		expect(ownerStatus.jewelFree).toBe(initialJewelFree + 100);
		expect(
			ownerStatus.memberFanLevels.find((level) => level.characterId === 1041)
				?.memberFanExperience,
		).toBe(1000);
		expect(presentBox.presentList).not.toContain(present);
		expect(presentBox.receivedPresentList).toContainEqual(
			expect.objectContaining({ d_present_boxes_id: presentBoxId }),
		);
		const inventory = state.userInventories.find(
			(item) => item.playerId === owner.player_id,
		);
		const gift = inventory?.itemCategoryList
			.flatMap((category) => category.userItemList)
			.find((item) => item.itemId === 2003073);
		if (gift === undefined) throw new Error('gift item missing');
		expect(
			(
				await postJson(
					app,
					'/v1/withstation/gift',
					{
						live_id: liveId,
						user_item_id: gift.userItemId,
						use_own_amount: 10,
						purchase_amount: 0,
						shop_item_id: 0,
					},
					ownerHeaders,
				)
			).status,
		).toBe(200);
		const giftPresent = presentBox.presentList.find(
			(item) => item.live_id === liveId,
		);
		if (giftPresent === undefined) throw new Error('gift prize missing');
		expect(giftPresent.withstationPlaybackReward).toBeUndefined();
		const giftPrize = await app.request(
			`/v1/withstation/prize?present_box_id=${giftPresent.d_present_boxes_id}`,
			{ headers: ownerHeaders },
		);
		expect(giftPrize.status).toBe(200);
		validate(prizeSchema, await giftPrize.clone().json());
		expect(await giftPrize.json()).toMatchObject({
			items: [],
			star_info: { star_num: 1 },
		});
		expect(
			(
				await postJson(
					app,
					'/v1/withstation/set_star',
					{
						present_box_id: giftPresent.d_present_boxes_id,
						set_star_json: starAllocation(1041, 1),
					},
					ownerHeaders,
				)
			).status,
		).toBe(200);
		expect(ownerStatus.jewelFree).toBe(initialJewelFree + 100);
		expect(
			ownerStatus.memberFanLevels.find((level) => level.characterId === 1041)
				?.memberFanExperience,
		).toBe(2000);
		const restored = serverStateSchema.parse(store.read());
		expect(restored.userStatuses).toEqual(state.userStatuses);
		expect(restored.archiveGiftPoints).toEqual(state.archiveGiftPoints);
		expect(restored.userPresentBoxes).toEqual(state.userPresentBoxes);
		const restartedApp = createTestApp({ stateStore, activeMasterRepository });
		for (const target of [app, restartedApp]) {
			expect(
				(
					await postJson(
						target,
						'/v1/withstation/set_star',
						request,
						ownerHeaders,
					)
				).status,
			).not.toBe(200);
			expect(
				(await target.request(previewPath, { headers: ownerHeaders })).status,
			).not.toBe(200);
		}
		expect(serverStateSchema.parse(store.read()).userStatuses).toEqual(
			restored.userStatuses,
		);
	} finally {
		store.close();
	}
}, 20_000);

function starAllocation(characterId: number, starNum: number): string {
	return JSON.stringify({
		set_star_info_list: [{ character_id: characterId, set_star_num: starNum }],
	});
}
