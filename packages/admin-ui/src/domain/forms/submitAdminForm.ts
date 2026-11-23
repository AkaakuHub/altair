import { AdminMutationCommittedError } from '@altair/runtime/admin/domain/admin-mutation-committed-error.ts';
import type { AdminMessages } from '../../i18n/messages.ts';

export async function submitAdminForm(
	operation: () => Promise<void>,
	onReload: () => Promise<void>,
	copy: AdminMessages['validation'],
	afterSubmit?: () => void,
): Promise<void> {
	let committedError: AdminMutationCommittedError | undefined;
	try {
		await operation();
	} catch (cause) {
		if (!(cause instanceof AdminMutationCommittedError)) throw cause;
		committedError = cause;
	}
	afterSubmit?.();
	try {
		await onReload();
	} catch (cause) {
		if (committedError === undefined) throw cause;
		const message = cause instanceof Error ? cause.message : String(cause);
		throw new AggregateError(
			[committedError, cause],
			copy.reloadFailure(committedError.message, message),
		);
	}
	if (committedError !== undefined) throw committedError;
}
