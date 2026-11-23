import type { Context } from 'hono';
import type { ResourceVersionRegistry } from '../../resource-versions.ts';
import type { ServerState } from '../../server-state-schema.ts';
import type { JsonValue } from '../../state/json-state-utils.ts';
import type { StoredResponse } from '../active-master-database/types.ts';
import { projectCurrentUserStamina } from './response-body-user-stamina.ts';
import { applyHeaders } from './response-header-common.ts';
import type { ResponseHeaderContext } from './response-header-context.ts';
import {
	getRouteErrorDefinition,
	type RouteErrorCode,
	type RouteErrorDefinition,
} from './route-errors.ts';

type JsonResponseStatus = 200 | RouteErrorDefinition['status'];

export function createStoredResponse(
	c: Context,
	defaultHeaders: ReadonlyArray<readonly [string, string]>,
	state: ServerState,
	resourceVersions: ResourceVersionRegistry,
	response: StoredResponse | undefined,
	context: ResponseHeaderContext,
): Response {
	if (!response) {
		return createErrorResponse(
			c,
			defaultHeaders,
			state,
			resourceVersions,
			'endpointNotImplemented',
			context,
		);
	}
	applyHeaders(c, defaultHeaders, state, resourceVersions, context);
	return createJsonResponse(
		c,
		projectCurrentUserStamina(c.req.raw.headers, response.body, state, context),
		toJsonResponseStatus(response.statusCode),
	);
}

export function createErrorResponse(
	c: Context,
	defaultHeaders: ReadonlyArray<readonly [string, string]>,
	state: ServerState,
	resourceVersions: ResourceVersionRegistry,
	code: RouteErrorCode,
	context: ResponseHeaderContext,
): Response {
	applyHeaders(c, defaultHeaders, state, resourceVersions, context);
	const definition = getRouteErrorDefinition(code);
	return createJsonResponse(
		c,
		definition.body ?? { error: definition.error },
		definition.status,
	);
}

function createJsonResponse(
	c: Context,
	body: JsonValue,
	status: JsonResponseStatus = 200,
): Response {
	c.header('content-type', 'application/json; charset=UTF-8');
	return c.body(`${JSON.stringify(body)}\n`, status);
}

function toJsonResponseStatus(statusCode: number): JsonResponseStatus {
	switch (statusCode) {
		case 200:
		case 400:
		case 404:
		case 500:
		case 501:
			return statusCode;
		default:
			throw new Error(`Unsupported stored response status: ${statusCode}`);
	}
}
