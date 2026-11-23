import type { Handler, Hono } from 'hono';

export function registerAdminUiPageRoutes(
	app: Hono,
	respond: Handler,
	extensionPaths: readonly string[] = [],
): void {
	app.get('/', respond);
	for (const path of extensionPaths) app.get(`/${path}`, respond);
}
