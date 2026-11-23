import type { GradeChallengeSummary } from '@altair/runtime/admin/dto/admin-grade-challenge-schema.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { useMemo } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import {
	SeasonRuntimePanel,
	type SeasonRuntimeSubmit,
} from './SeasonRuntimePanel.tsx';

function getSeasonId(row: GradeChallengeSummary): number {
	return row.gradeChallengeSeasonId;
}
function getSeasonLabel(row: GradeChallengeSummary): string {
	return `${row.gradeChallengeSeasonId} ${row.name} ${row.startDate} - ${row.endDate}`;
}

export function GradeChallengeRuntimePanel({
	data,
	isSubmitting,
	submitForm,
}: {
	data: AdminStateResponse;
	isSubmitting: boolean;
	submitForm: SeasonRuntimeSubmit;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const runtime = data.state.gradeChallenge;
	const source = useMemo(
		() => ({
			seasonId: runtime.activeGradeChallengeSeasonId,
			status: runtime.status,
			startDate: runtime.startDate,
			endDate: runtime.endDate,
		}),
		[runtime],
	);
	return (
		<SeasonRuntimePanel<GradeChallengeSummary>
			title={messages.gradeLive.challenge}
			configuration={{
				path: 'gradeChallenge',
				activeId: 'activeGradeChallengeSeasonId',
			}}
			source={source}
			rows={data.gradeChallengeList}
			getSeasonId={getSeasonId}
			getSeasonLabel={getSeasonLabel}
			isSubmitting={isSubmitting}
			submitForm={submitForm}
			columns={[
				{
					key: 'id',
					label: messages.gradeLive.seasonId,
					render: (row) => row.gradeChallengeSeasonId,
				},
				{ key: 'name', label: messages.name, render: (row) => row.name },
				{
					key: 'giveSeasonGradeId',
					label: messages.gradeLive.giveGrade,
					render: (row) => row.giveSeasonGradeId,
				},
				{
					key: 'rankingPrize',
					label: messages.gradeLive.rankingPrize,
					render: (row) => (row.isRankingPrize ? messages.yes : messages.no),
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
