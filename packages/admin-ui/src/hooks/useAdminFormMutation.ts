import { useRef, useState } from 'react';
import { postAdminForm } from '../api.ts';
import { submitAdminForm } from '../domain/forms/submitAdminForm.ts';
import type { AdminFormValues } from '../form-value.ts';
import { useAdminLanguage } from '../i18n/AdminLanguageProvider.tsx';
import { useAdminMutationError } from './useAdminMutationError.ts';

type AdminFormMutation = {
	isSubmitting: boolean;
	error: string | null;
	clearError: () => void;
	reportError: (cause: unknown) => void;
	submitForm: (
		path: string,
		values: AdminFormValues,
		afterSubmit?: () => void,
	) => Promise<void>;
	submitPlayerForm: (
		path: string,
		playerId: string,
		values: AdminFormValues,
		afterSubmit?: () => void,
	) => Promise<void>;
};

export function useAdminFormMutation(
	onReload: () => Promise<void>,
	{
		onErrorChange,
	}: Readonly<{ onErrorChange?: (message: string | null) => void }> = {},
): AdminFormMutation {
	const { messages } = useAdminLanguage();
	const copy = useRef(messages.validation);
	copy.current = messages.validation;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const pending = useRef(false);
	const { error, clearError, reportError } =
		useAdminMutationError(onErrorChange);

	async function submitForm(
		path: string,
		values: AdminFormValues,
		afterSubmit?: () => void,
	): Promise<void> {
		if (pending.current) return;
		pending.current = true;
		setIsSubmitting(true);
		clearError();
		try {
			await submitAdminForm(
				() => postAdminForm(path, values, copy.current),
				onReload,
				copy.current,
				afterSubmit,
			);
		} catch (cause: unknown) {
			reportError(cause);
		} finally {
			pending.current = false;
			setIsSubmitting(false);
		}
	}

	async function submitPlayerForm(
		path: string,
		playerId: string,
		values: AdminFormValues,
		afterSubmit?: () => void,
	): Promise<void> {
		await submitForm(path, { playerId, ...values }, afterSubmit);
	}

	return {
		isSubmitting,
		error,
		clearError,
		reportError,
		submitForm,
		submitPlayerForm,
	};
}
