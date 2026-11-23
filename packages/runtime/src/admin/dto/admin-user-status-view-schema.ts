import type { z } from 'zod';
import type { UserStatusState } from '../../../../../src/state/user-status-types.ts';
import { objectSchema } from './dto-schema-utils.ts';

export const userStatusViewSchema = objectSchema<
	Omit<UserStatusState, 'playerId'> & {
		fanLevel: number;
		presentBoxCount: number;
	}
>();

export type AdminUserStatusView = z.infer<typeof userStatusViewSchema>;
