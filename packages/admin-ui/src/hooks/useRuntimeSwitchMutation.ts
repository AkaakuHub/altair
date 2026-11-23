import type { RuntimeResourceOptionIds } from '@altair/runtime/admin/dto/runtime-resource-version-schema.ts';
import { useRef, useState } from 'react';
import { postRuntimeSwitch } from '../api.ts';
import { useAdminMutationError } from './useAdminMutationError.ts';

type RuntimeSwitchMutation = {
	isRestarting: boolean;
	error: string | null;
	submitRuntimeSwitch: (
		selection: RuntimeResourceOptionIds,
		afterSubmit?: () => void,
	) => Promise<void>;
};

export function useRuntimeSwitchMutation(): RuntimeSwitchMutation {
	const [isRestarting, setIsRestarting] = useState(false);
	const pending = useRef(false);
	const { error, clearError, reportError } = useAdminMutationError();

	async function submitRuntimeSwitch(
		selection: RuntimeResourceOptionIds,
		afterSubmit?: () => void,
	): Promise<void> {
		if (pending.current) return;
		pending.current = true;
		setIsRestarting(true);
		clearError();
		try {
			await postRuntimeSwitch(selection);
			afterSubmit?.();
			window.setTimeout(() => window.location.reload(), 8_000);
		} catch (cause: unknown) {
			pending.current = false;
			setIsRestarting(false);
			reportError(cause);
		}
	}

	return { isRestarting, error, submitRuntimeSwitch };
}
