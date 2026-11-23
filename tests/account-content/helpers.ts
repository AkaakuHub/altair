import type { RegisteredUserResponse } from '../response-types.ts';
import { type createTestApp, registerNewUser } from '../test-app.ts';

type TestApp = ReturnType<typeof createTestApp>;

export async function registerAccountContentUser(
	app: TestApp,
): Promise<RegisteredUserResponse> {
	return await registerNewUser(app);
}
