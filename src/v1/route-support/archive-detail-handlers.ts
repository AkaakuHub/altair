import type { Context } from 'hono';
import { readJson } from '../http/read-json.ts';
import { respondArchiveDetail } from './archive-detail.ts';
import {
	readArchiveDetailId,
	readArchiveWithliveRequest,
} from './archive-request.ts';
import { respondArchiveWithliveInfo } from './archive-withlive-info.ts';
import type { StateRouteContext } from './state-route-context.ts';

export function createArchiveWithDataHandler(routeContext: StateRouteContext) {
	return async (c: Context) =>
		respondArchiveDetail(
			c,
			routeContext,
			readArchiveDetailId(await readJson(c.req.raw), 'archives_id'),
			'withlive',
		);
}
export function createArchiveWithliveInfoGetHandler(
	routeContext: StateRouteContext,
) {
	return (c: Context) => respondArchiveWithliveInfo(c, routeContext);
}
export function createArchiveWithliveInfoPostHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) => {
		const { archiveId } = readArchiveWithliveRequest(await readJson(c.req.raw));
		return archiveId.length > 0
			? respondArchiveDetail(c, routeContext, archiveId, 'withlive')
			: respondArchiveWithliveInfo(c, routeContext);
	};
}
export function createArchiveFesDataHandler(routeContext: StateRouteContext) {
	return async (c: Context) =>
		respondArchiveDetail(
			c,
			routeContext,
			readArchiveDetailId(await readJson(c.req.raw), 'archives_id'),
			'fes',
		);
}
export function createArchiveWithStationDataHandler(
	routeContext: StateRouteContext,
) {
	return async (c: Context) =>
		respondArchiveDetail(
			c,
			routeContext,
			readArchiveDetailId(await readJson(c.req.raw), 'withstation_id'),
			'withstation',
		);
}
