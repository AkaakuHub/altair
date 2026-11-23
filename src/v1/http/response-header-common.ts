import type { Context } from 'hono';
import { getActiveGachaHeaderState } from '../../application/gacha-availability-service.ts';
import type { ResourceVersionRegistry } from '../../resource-versions.ts';
import { resolveResponseResourceVersion } from '../../resource-versions.ts';
import type { ServerState } from '../../server-state-schema.ts';
import { resolveRequestUser } from '../route-support/request-user.ts';
import type { ResponseHeaderContext } from './response-header-context.ts';
import {
	dateGmtPlaceholder,
	resourceVersionPlaceholder,
	stateHeaderValue,
} from './response-header-definitions.ts';
import { renderStateHeaderValue } from './response-state-headers.ts';

export function applyHeaders(
	c: Context,
	headers: ReadonlyArray<readonly [string, string]>,
	state: ServerState,
	resourceVersions: ResourceVersionRegistry,
	context: ResponseHeaderContext,
): void {
	const dateGmt = (context.date ?? new Date()).toUTCString();
	const user = context.user ?? resolveRequestUser(c.req.raw.headers, state);
	const responseHeaderContext: ResponseHeaderContext = {
		...context,
		user,
		gachaHeaderState:
			context.gachaHeaderState ??
			getActiveGachaHeaderState(
				context.getGachaSeriesAdminSummary(),
				state.gachaSeriesActivations,
			),
	};
	const responseResourceVersion = resolveResponseResourceVersion(
		c.req.raw.headers,
		user?.platformType,
		resourceVersions,
		state.resourceVersionOverrides,
	);
	for (const [name, value] of headers) {
		c.header(
			name,
			renderHeaderValue(
				name,
				value,
				dateGmt,
				responseResourceVersion,
				state,
				responseHeaderContext,
			),
		);
	}
}

function renderHeaderValue(
	name: string,
	value: string,
	dateGmt: string,
	responseResourceVersion: string,
	state: ServerState,
	context: ResponseHeaderContext,
): string {
	const stateHeader = renderStateHeaderValue(name, state, context);
	if (stateHeader !== undefined) return stateHeader;
	if (value === stateHeaderValue) {
		throw new Error(`Missing state response header renderer: ${name}`);
	}
	return value
		.replaceAll(dateGmtPlaceholder, dateGmt)
		.replaceAll(resourceVersionPlaceholder, responseResourceVersion);
}
