import type { AdminFormValues } from '../../../form-value.ts';

export type CircleSubmitForm = (
	path: string,
	values: AdminFormValues,
	afterSubmit?: () => void,
) => Promise<void>;
