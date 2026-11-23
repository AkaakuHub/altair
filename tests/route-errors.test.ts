import { describe, expect, test } from 'bun:test';
import { getRouteErrorDefinition } from '../src/v1/http/route-errors.ts';

describe('route error catalog', () => {
	test('keeps master release session failures explicit', () => {
		expect(getRouteErrorDefinition('sessionMasterReleaseUnavailable')).toEqual({
			error: 'localify_session_master_release_unavailable',
			status: 500,
		});
	});

	test('keeps the official logout body for an unknown request user', () => {
		expect(getRouteErrorDefinition('requestUserNotFound')).toEqual({
			error: 'localify_request_user_not_found',
			status: 401,
			body: {
				error_code: '00200_000001',
				message: '他の端末でログインしたため、ログアウトされました。',
				title: 'ログアウト',
			},
		});
	});
});
