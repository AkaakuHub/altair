import { zValidator } from '@hono/zod-validator';
import type { Context, Env } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { isRecord } from '../state/json-state-utils.ts';
import type { CommentsRepositoryProvider } from './comments-repository-provider.ts';
import { readJson } from './http/read-json.ts';
import { createStandardResponseHeaders } from './http/response-header-definitions.ts';
import type { ArchiveCommentResponse } from './response-types/archive-operation-types.ts';
import {
	createArchiveCommentResponse,
	readCommentPlayTimeSecond,
} from './route-support/archive-comment-response.ts';
import { renderArchiveResponseHeader } from './route-support/archive-response-headers.ts';
import { typedEndpoint } from './route-support/endpoint-source.ts';

const withliveQuerySchema = z.object({
	live_id: z.string().min(1),
	play_time_second: z.coerce.number<number>().int().nonnegative().prefault(0),
	timeline_unixtime: z.coerce.number<number>().int().optional(),
});

const fesTimelineSchema = z.object({
	archives_id: z.string().min(1),
	play_time_second: z.coerce.number<number>().int().nonnegative().prefault(0),
	timeline_unixtime: z.coerce.number<number>().int().optional(),
});

export type FesTimelineRequest = z.input<typeof fesTimelineSchema>;

export function createArchiveCommentRoutes(
	getComments: CommentsRepositoryProvider,
	resolveResponseResourceVersion: (headers: Headers) => string,
): Hono {
	const app = new Hono<Env>();
	const standardHeaders = createStandardResponseHeaders();

	app.get(
		'/v1/archive/withlive_info',
		zValidator('query', withliveQuerySchema),
		(c) => {
			const query = c.req.valid('query');
			applyStandardHeaders(
				c,
				standardHeaders,
				resolveResponseResourceVersion(c.req.raw.headers),
			);
			return c.json(
				createArchiveCommentResponse(
					getComments(),
					query.live_id,
					query.play_time_second,
				),
			);
		},
	);

	app.post('/v1/archive/withlive_info', async (c) => {
		const body = await readJson(c.req.raw);
		const parsed = parseWithliveBody(body);
		applyStandardHeaders(
			c,
			standardHeaders,
			resolveResponseResourceVersion(c.req.raw.headers),
		);
		if (!parsed) {
			return c.json(createArchiveCommentResponse(undefined), 400);
		}
		return c.json(
			createArchiveCommentResponse(
				getComments(),
				parsed.liveId,
				parsed.playTimeSecond,
			),
		);
	});

	typedEndpoint<FesTimelineRequest, ArchiveCommentResponse>();
	app.post(
		'/v1/archive/get_fes_timeline_data',
		zValidator('json', fesTimelineSchema),
		(c) => {
			const body = c.req.valid('json');
			applyStandardHeaders(
				c,
				standardHeaders,
				resolveResponseResourceVersion(c.req.raw.headers),
			);
			return c.json(
				createArchiveCommentResponse(
					getComments(),
					body.archives_id,
					body.play_time_second,
				),
			);
		},
	);

	return app;
}

function parseWithliveBody(
	body: unknown,
): { liveId: string; playTimeSecond: number } | undefined {
	if (typeof body === 'string' && body.length > 0) {
		return { liveId: body, playTimeSecond: 0 };
	}
	if (!isRecord(body)) {
		return undefined;
	}
	const liveId = readString(body.live_id) ?? readString(body.archives_id);
	if (!liveId) {
		return undefined;
	}
	return {
		liveId,
		playTimeSecond: readCommentPlayTimeSecond(body.play_time_second) ?? 0,
	};
}

function readString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function applyStandardHeaders(
	c: Context,
	headers: ReadonlyArray<readonly [string, string]>,
	resourceVersion: string,
): void {
	const dateGmt = new Date().toUTCString();
	for (const [name, value] of headers) {
		c.header(
			name,
			renderArchiveResponseHeader(value, dateGmt, resourceVersion),
		);
	}
}
