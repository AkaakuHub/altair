import { useCallback, useMemo } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminFormMutation } from '../../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import type { AdminPageProps } from '../../page-props.ts';
import { ActiveLoginBonusStateSection } from './ActiveLoginBonusStateSection.tsx';
import { LoginBonusProgressSection } from './LoginBonusProgressSection.tsx';
import {
	createLoginBonusProgressForm,
	findSelectedAdminUserSession,
	getActiveLoginBonuses,
	type LoginBonusProgressForm,
	parseLoginBonusReceivedCount,
} from './login-bonus-model.ts';
import { SelectedLoginBonusSection } from './SelectedLoginBonusSection.tsx';

function loginBonusKey(value: LoginBonusProgressForm): string {
	return String(value.loginBonusId);
}

export function UserLoginBonusEditor({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const activeLoginBonuses = useMemo(
		() =>
			getActiveLoginBonuses(
				data.seed.loginBonuses,
				data.state.loginBonusActivations,
			),
		[data.seed.loginBonuses, data.state.loginBonusActivations],
	);
	const initialLoginBonusId = activeLoginBonuses[0]?.loginBonusId ?? 0;
	const resolveSource = useCallback(
		(value: LoginBonusProgressForm) => {
			const id =
				value.loginBonusId === 0 ? initialLoginBonusId : value.loginBonusId;
			return activeLoginBonuses.some((bonus) => bonus.loginBonusId === id)
				? createLoginBonusProgressForm(data, id)
				: null;
		},
		[data, activeLoginBonuses, initialLoginBonusId],
	);
	const draft = useAdminFormDraft(
		createLoginBonusProgressForm(data, initialLoginBonusId),
		resolveSource,
		loginBonusKey,
	);
	const form = draft.value;
	const setForm = draft.setValue;
	const selectedLoginBonus = activeLoginBonuses.find(
		(bonus) => bonus.loginBonusId === form.loginBonusId,
	);
	const progresses =
		findSelectedAdminUserSession(data)?.loginBonusProgresses ?? [];
	const { isSubmitting, error, submitForm } = useAdminFormMutation(onReload);

	return (
		<>
			<AdminFormStatus
				error={
					error ??
					(!draft.isAvailable && form.loginBonusId !== 0
						? messages.loginBonus.unavailable
						: null)
				}
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<LoginBonusProgressSection
				form={form}
				selectedLoginBonus={selectedLoginBonus}
				onChange={setForm}
				isSubmitting={isSubmitting}
				isSaveDisabled={
					!draft.isAvailable || findSelectedAdminUserSession(data) === undefined
				}
				onSave={() =>
					void submitForm(
						'/admin/login-bonus',
						{ ...form, receivedCount: Number(form.receivedCount) },
						() => draft.acceptSaved(form),
					)
				}
			/>
			{selectedLoginBonus && (
				<SelectedLoginBonusSection
					loginBonus={selectedLoginBonus}
					receivedCount={parseLoginBonusReceivedCount(form.receivedCount)}
				/>
			)}
			<ActiveLoginBonusStateSection
				disabled={isSubmitting}
				rows={activeLoginBonuses}
				progresses={progresses}
				selectedLoginBonusId={form.loginBonusId}
				onSelect={(row) => {
					if (!isSubmitting)
						setForm(createLoginBonusProgressForm(data, row.loginBonusId));
				}}
			/>
		</>
	);
}
