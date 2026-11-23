import type { GradeLiveSummary } from '@altair/runtime/admin/dto/admin-grade-live-schema.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { useMemo } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import {
	SeasonRuntimePanel,
	type SeasonRuntimeSubmit,
} from './SeasonRuntimePanel.tsx';

function getSeasonId(row: GradeLiveSummary): number {
	return row.gradeQuestSeasonId;
}
function getSeasonLabel(row: GradeLiveSummary): string {
	return `${row.gradeQuestSeasonId} ${row.name} ${row.startDate} - ${row.endDate}`;
}

export function GradeLiveRuntimePanel({
	data,
	isSubmitting,
	submitForm,
}: {
	data: AdminStateResponse;
	isSubmitting: boolean;
	submitForm: SeasonRuntimeSubmit;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const runtime = data.state.gradeLive;
	const source = useMemo(
		() => ({
			seasonId: runtime.activeGradeQuestSeasonId,
			status: runtime.status,
			startDate: runtime.startDate,
			endDate: runtime.endDate,
		}),
		[runtime],
	);
	return (
		<SeasonRuntimePanel<GradeLiveSummary>
			title={messages.pages['grade-live']}
			configuration={{
				path: 'gradeLive',
				activeId: 'activeGradeQuestSeasonId',
			}}
			source={source}
			rows={data.gradeLiveList}
			getSeasonId={getSeasonId}
			getSeasonLabel={getSeasonLabel}
			isSubmitting={isSubmitting}
			submitForm={submitForm}
			columns={[
				{
					key: 'id',
					label: messages.gradeLive.seasonId,
					render: (row) => row.gradeQuestSeasonId,
				},
				{ key: 'name', label: messages.name, render: (row) => row.name },
				{
					key: 'generation',
					label: messages.gradeLive.generation,
					render: (row) => row.generation,
				},
				{
					key: 'season',
					label: messages.gradeLive.season,
					render: (row) => row.season,
				},
				{
					key: 'start',
					label: messages.startTime,
					render: (row) => row.startDate,
				},
				{ key: 'end', label: messages.endTime, render: (row) => row.endDate },
			]}
		/>
	);
}
