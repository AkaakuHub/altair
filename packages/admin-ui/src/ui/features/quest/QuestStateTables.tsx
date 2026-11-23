import type { AdminUserLive } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { DailyQuestPanel } from './DailyQuestPanel.tsx';
import { DreamLivePanel } from './DreamLivePanel.tsx';
import { GradeLivePanel } from './GradeLivePanel.tsx';
import { GrandPrixPanel } from './GrandPrixPanel.tsx';
import { LearningLivePanel } from './LearningLivePanel.tsx';
import type {
	DailyTicketDraft,
	DreamLiveProgressDraft,
	GradeProgressDraft,
	GrandPrixProgressDraft,
	LearningProgressDraft,
	QuestProgressDraft,
} from './quest-drafts.ts';
import { createQuestProgressDraft } from './quest-drafts.ts';
import { questProgressKey } from './quest-model.ts';
import type { createStandardQuestRowsByArea } from './quest-state-table-model.ts';
import { StandardQuestPanel } from './StandardQuestPanel.tsx';

type QuestStateTablesProps = {
	standardQuestRows: ReturnType<typeof createStandardQuestRowsByArea>;
	questEdits: Record<string, QuestProgressDraft>;
	dreamLiveRows: DreamLiveProgressDraft[];
	learningRows: LearningProgressDraft[];
	gradeRows: GradeProgressDraft[];
	currentGradeQuest: AdminUserLive['currentGradeQuest'];
	grandPrixRows: GrandPrixProgressDraft[];
	dailyTicketForm: DailyTicketDraft;
	standardStar: number;
	isMutationDisabled: boolean;
	onQuestChange: (
		row: QuestProgressDraft,
		patch: Partial<QuestProgressDraft>,
	) => void;
	onDreamLiveChange: (
		row: DreamLiveProgressDraft,
		patch: Partial<DreamLiveProgressDraft>,
	) => void;
	onLearningChange: (
		row: LearningProgressDraft,
		patch: Partial<LearningProgressDraft>,
	) => void;
	onGradeChange: (
		row: GradeProgressDraft,
		patch: Partial<GradeProgressDraft>,
	) => void;
	onGrandPrixChange: (
		row: GrandPrixProgressDraft,
		patch: Partial<GrandPrixProgressDraft>,
	) => void;
	onDailyTicketChange: (patch: Partial<DailyTicketDraft>) => void;
	onQuestSave: (form: QuestProgressDraft) => Promise<void>;
	onDreamLiveSave: (form: DreamLiveProgressDraft) => Promise<void>;
	onLearningSave: (form: LearningProgressDraft) => Promise<void>;
	onGradeSave: (form: GradeProgressDraft) => Promise<void>;
	onGrandPrixSave: (form: GrandPrixProgressDraft) => Promise<void>;
	onDailyTicketSave: () => Promise<void>;
};

type QuestTab =
	| 'standard'
	| 'daily'
	| 'learning'
	| 'dream'
	| 'grade'
	| 'grand-prix';

export function QuestStateTables({
	standardQuestRows,
	questEdits,
	dreamLiveRows,
	learningRows,
	gradeRows,
	currentGradeQuest,
	grandPrixRows,
	dailyTicketForm,
	standardStar,
	isMutationDisabled,
	onQuestChange,
	onDreamLiveChange,
	onLearningChange,
	onGradeChange,
	onGrandPrixChange,
	onDailyTicketChange,
	onQuestSave,
	onDreamLiveSave,
	onLearningSave,
	onGradeSave,
	onGrandPrixSave,
	onDailyTicketSave,
}: QuestStateTablesProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const [tab, setTab] = useState<QuestTab>('standard');
	const standardQuestRowsByArea = standardQuestRows.map(({ area, rows }) => ({
		area,
		rows: rows.map((row) => ({
			...row,
			progress:
				questEdits[questProgressKey(row.progress)] ??
				createQuestProgressDraft(row.progress),
		})),
	}));
	return (
		<Box>
			<Tabs
				value={tab}
				variant="scrollable"
				scrollButtons="auto"
				onChange={(_, value: QuestTab) => setTab(value)}
				sx={{ mb: 2 }}
			>
				<Tab value="standard" label={messages.quest.standard} />
				<Tab value="daily" label={messages.quest.daily} />
				<Tab value="learning" label={messages.quest.learning} />
				<Tab value="dream" label={messages.quest.dream} />
				<Tab value="grade" label={messages.pages['grade-live']} />
				<Tab value="grand-prix" label={messages.pages['grand-prix']} />
			</Tabs>
			{tab === 'standard' ? (
				<StandardQuestPanel
					areas={standardQuestRowsByArea}
					standardStar={standardStar}
					isMutationDisabled={isMutationDisabled}
					onQuestChange={onQuestChange}
					onQuestSave={onQuestSave}
				/>
			) : null}
			{tab === 'daily' ? (
				<DailyQuestPanel
					form={dailyTicketForm}
					isMutationDisabled={isMutationDisabled}
					onChange={onDailyTicketChange}
					onSave={onDailyTicketSave}
				/>
			) : null}
			{tab === 'learning' ? (
				<LearningLivePanel
					rows={learningRows}
					isMutationDisabled={isMutationDisabled}
					onChange={onLearningChange}
					onSave={onLearningSave}
				/>
			) : null}
			{tab === 'dream' ? (
				<DreamLivePanel
					rows={dreamLiveRows}
					isMutationDisabled={isMutationDisabled}
					onChange={onDreamLiveChange}
					onSave={onDreamLiveSave}
				/>
			) : null}
			{tab === 'grade' ? (
				<GradeLivePanel
					rows={gradeRows}
					currentGradeQuest={currentGradeQuest}
					isMutationDisabled={isMutationDisabled}
					onChange={onGradeChange}
					onSave={onGradeSave}
				/>
			) : null}
			{tab === 'grand-prix' ? (
				<GrandPrixPanel
					rows={grandPrixRows}
					isMutationDisabled={isMutationDisabled}
					onChange={onGrandPrixChange}
					onSave={onGrandPrixSave}
				/>
			) : null}
		</Box>
	);
}
