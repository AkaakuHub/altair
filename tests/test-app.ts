import { Database } from 'bun:sqlite';
import { expect } from 'bun:test';
import { fileURLToPath } from 'node:url';
import type { ServerConfig } from '../src/config.ts';
import { createApp } from '../src/server.ts';
import { createNoopServerStateStore } from '../src/server-state-store-port.ts';
import { externalFixturePath } from './externalFixtures/sourcePath.ts';
import { type MockPlayerName, mockPlayerNames } from './mock-player-names.ts';
import type { RegisteredUserResponse } from './response-types.ts';

const root = externalFixturePath('runtime');
const currentMasterDatabase = new Database(
	`${root}/master-archive/active.sqlite`,
	{
		readonly: true,
	},
);
const activeMasterRepository = {
	selection: {
		releaseId: 'r2606002',
		databaseFingerprint: 'test-fixture',
		androidResourceVersion: 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ==',
		iosResourceVersion: 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
		database: currentMasterDatabase,
	},
	close: () => {},
};

export const config: ServerConfig = {
	root,
	host: '0.0.0.0',
	port: 8080,
	commentsDb: externalFixturePath('..', 'comments', 'comments.sqlite'),
	officialUserInitialStateRoot: fileURLToPath(
		new URL('../official-user-initial-state', import.meta.url),
	),
	resourceVersionRegistryRoot: `${root}/resource-version-registry`,
	requestLogEnabled: true,
	requestLogDbPath: ':memory:',
	stateDbPath: ':memory:',
	activeMasterDatabasePath: `${root}/master-archive/active.sqlite`,
	selectedMasterReleasePath: `${root}/master-archive/releases/selected-release.json`,
	activeLoginBonusIds: [101002, 201001, 201064],
	currentDate: () => new Date(),
	activeMasterRepository,
};

type TestApp = ReturnType<typeof createApp>;

type TestAppOverrides = Partial<ServerConfig>;

type JsonRequestBody = object | string | number | boolean | null;

type SessionTokenResponse = {
	session_token?: string;
} | null;

export function createTestApp(
	overrides?: TestAppOverrides,
	createApplication: (config: ServerConfig) => TestApp = createApp,
): TestApp {
	const app = createApplication({
		...config,
		...(overrides ?? {}),
		stateStore: overrides?.stateStore ?? createNoopServerStateStore(),
	});
	let currentSessionToken = '';
	const request = app.request.bind(app);
	app.request = (async (...args: Parameters<typeof app.request>) => {
		const [input, init, env] = args;
		const nextInit = addAuthorizationHeader(input, init, currentSessionToken);
		const response = await request(input, nextInit, env);
		currentSessionToken = await readSessionToken(response, currentSessionToken);
		return response;
	}) as typeof app.request;
	return app;
}

export async function postJson(
	app: TestApp,
	path: string,
	body: JsonRequestBody = {},
	headers?: HeadersInit,
): Promise<Response> {
	const init: RequestInit = {
		method: 'POST',
		body: JSON.stringify(body),
	};
	if (headers) {
		init.headers = headers;
	}
	return await app.request(path, init);
}

export async function registerNewUser(
	app: TestApp,
	name: MockPlayerName = mockPlayerNames[0],
): Promise<RegisteredUserResponse> {
	const response = await postJson(app, '/v1/register/set_new_user', {
		platform_type: 1,
		name,
	});
	expect(response.status).toBe(200);
	return (await response.json()) as RegisteredUserResponse;
}

export function authHeaders(sessionToken: string): HeadersInit {
	return { authorization: `Bearer ${sessionToken}` };
}

function addAuthorizationHeader(
	input: Parameters<TestApp['request']>[0],
	init: Parameters<TestApp['request']>[1],
	sessionToken: string,
): Parameters<TestApp['request']>[1] {
	if (sessionToken.length === 0 || !isV1Path(input)) {
		return init;
	}
	const headers = new Headers(init?.headers);
	if (headers.has('authorization')) {
		return init;
	}
	headers.set('authorization', `Bearer ${sessionToken}`);
	return { ...init, headers };
}

function isV1Path(input: Parameters<TestApp['request']>[0]): boolean {
	if (typeof input === 'string') {
		return input.startsWith('/v1/');
	}
	if (input instanceof Request) {
		return new URL(input.url).pathname.startsWith('/v1/');
	}
	return input.pathname.startsWith('/v1/');
}

async function readSessionToken(
	response: Response,
	currentSessionToken: string,
): Promise<string> {
	if (!response.headers.get('content-type')?.includes('application/json')) {
		return currentSessionToken;
	}
	const body = (await response.clone().json()) as SessionTokenResponse;
	if (
		body !== null &&
		typeof body.session_token === 'string' &&
		body.session_token.length > 0
	) {
		return body.session_token;
	}
	return currentSessionToken;
}
