import type { AdminFormValues } from '../../../form-value.ts';

export type UserSubmitForm = (
	path: string,
	values: AdminFormValues,
	afterSubmit?: () => void,
) => Promise<void>;
