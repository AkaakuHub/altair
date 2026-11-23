import type {
	OfficialDataMigrationApplyResult,
	OfficialDataMigrationPreview,
} from '@altair/runtime/admin/dto/official-data-migration.ts';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useRef, useState } from 'react';
import {
	applyOfficialDataMigrationDump,
	previewOfficialDataMigrationDump,
} from '../../api.ts';
import { useAdminUnsavedChanges } from '../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../components/AdminSectionCard.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { OfficialMigrationPreviewPanel } from '../features/official-migration/OfficialMigrationPreviewPanel.tsx';
import type { AdminPageProps } from '../page-props.ts';

export function OfficialMigrationPage({
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const copy = messages.officialMigration;
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<OfficialDataMigrationPreview | null>(
		null,
	);
	const [applyResult, setApplyResult] =
		useState<OfficialDataMigrationApplyResult | null>(null);
	const [accountLinkIdToken, setAccountLinkIdToken] = useState('');
	const [baseline, setBaseline] = useState<
		Readonly<{ file: File | null; accountLinkIdToken: string }>
	>({ file: null, accountLinkIdToken: '' });
	useAdminUnsavedChanges(
		file !== baseline.file ||
			accountLinkIdToken !== baseline.accountLinkIdToken,
	);
	const [error, setError] = useState<string | null>(null);
	const [operation, setOperation] = useState<'preview' | 'apply' | null>(null);
	const operationRef = useRef(false);
	const isPending = operation !== null;

	const handlePreview = async () => {
		if (file === null || operationRef.current) {
			return;
		}
		operationRef.current = true;
		setOperation('preview');
		setError(null);
		setPreview(null);
		setApplyResult(null);
		try {
			setPreview(
				await previewOfficialDataMigrationDump(file, messages.validation),
			);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : String(caught));
		} finally {
			operationRef.current = false;
			setOperation(null);
		}
	};

	const handleApply = async () => {
		if (file === null || preview === null || operationRef.current) {
			return;
		}
		operationRef.current = true;
		setOperation('apply');
		setError(null);
		setApplyResult(null);
		try {
			const result = await applyOfficialDataMigrationDump(
				file,
				{
					accountLinkIdToken: accountLinkIdToken.trim(),
				},
				messages.validation,
			);
			setApplyResult(result);
			if (result.errors.length === 0) setBaseline({ file, accountLinkIdToken });
			await onReload();
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : String(caught));
		} finally {
			operationRef.current = false;
			setOperation(null);
		}
	};

	return (
		<>
			<PageHeader
				title={messages.pages['official-migration']}
				onReload={onReload}
			/>
			<AdminSectionCard title={copy.dumpFile}>
				<Stack spacing={2}>
					<Button
						component="label"
						aria-label={
							file === null ? copy.selectZip : copy.selectedZip(file.name)
						}
						variant="outlined"
						startIcon={<CloudUploadIcon />}
						disabled={isPending}
						sx={{ maxWidth: '100%', overflowWrap: 'anywhere' }}
					>
						{file?.name ?? copy.selectZip}
						<input
							hidden
							type="file"
							accept=".zip,application/zip"
							disabled={isPending}
							onChange={(event) => {
								const selectedFile = event.target.files?.[0];
								event.target.value = '';
								if (operationRef.current || selectedFile === undefined) return;
								setFile(selectedFile);
								setPreview(null);
								setApplyResult(null);
								setError(null);
							}}
						/>
					</Button>
					<TextField
						label={copy.password}
						type="password"
						value={accountLinkIdToken}
						disabled={isPending}
						onChange={(event) => setAccountLinkIdToken(event.target.value)}
						fullWidth
					/>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<Button
							variant="contained"
							startIcon={<PlaylistAddCheckIcon />}
							loading={operation === 'preview'}
							disabled={file === null || isPending}
							onClick={() => void handlePreview()}
						>
							{copy.preview}
						</Button>
						<Button
							variant="contained"
							color="secondary"
							loading={operation === 'apply'}
							disabled={file === null || preview === null || isPending}
							onClick={() => void handleApply()}
						>
							{messages.apply}
						</Button>
					</Stack>
					<AdminFormStatus error={error} />
					{applyResult ? (
						<Alert
							severity={applyResult.errors.length > 0 ? 'warning' : 'success'}
						>
							{copy.applied(
								applyResult.playerId,
								applyResult.appliedCategories.join(', '),
							)}
						</Alert>
					) : null}
				</Stack>
			</AdminSectionCard>
			{preview ? <OfficialMigrationPreviewPanel preview={preview} /> : null}
			{applyResult && applyResult.errors.length > 0 ? (
				<AdminSectionCard title={copy.applyErrors}>
					<Stack spacing={1}>
						{applyResult.errors.map((message) => (
							<Alert key={message} severity="warning">
								{message}
							</Alert>
						))}
					</Stack>
				</AdminSectionCard>
			) : null}
		</>
	);
}
