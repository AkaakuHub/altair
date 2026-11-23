import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';

export type AdminPageProps<
	Response extends AdminStateResponse = AdminStateResponse,
> = {
	data: Response;
	onReload: () => Promise<void>;
};
