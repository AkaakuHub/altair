import type { ServerState } from '../../server-state-schema.ts';
import {
	isJsonObject,
	type JsonObject,
	type JsonValue,
} from '../../state/json-state-utils.ts';
import { resolveRequestUser } from '../route-support/request-user.ts';
import type { ResponseHeaderContext } from './response-header-context.ts';

export function projectCurrentUserStamina(
	headers: Headers,
	body: JsonValue,
	state: ServerState,
	context: ResponseHeaderContext,
): JsonValue {
	if (!isJsonObject(body) || !('user_stamina' in body)) {
		return body;
	}
	const userStatus = context.getUserStatusView(
		state,
		resolveRequestUser(headers, state),
	);
	return {
		...body,
		user_stamina: {
			stamina_now: userStatus.staminaNow,
			stamina_max: userStatus.staminaMax,
			stamina_recovery_time: userStatus.staminaRecoveryTime,
		},
	} satisfies JsonObject;
}
