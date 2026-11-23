export type ReleaseCandidateCompatibilityIssue =
	| Readonly<{
			kind:
				| 'platform-table-availability-mismatch'
				| 'platform-schema-mismatch'
				| 'platform-data-mismatch';
			tableLabel: string;
	  }>
	| Readonly<{
			kind: 'webview-card-unresolved';
			gachaSeriesId: number;
			rateIndex: number;
			cardIndex: number;
	  }>
	| Readonly<{
			kind: 'derived-master-table-unavailable';
			source: 'archive' | 'webview-gacha';
			tableLabel: string;
	  }>
	| Readonly<{
			kind: 'derived-master-field-unavailable';
			source: 'webview-gacha';
			tableLabel: string;
			fieldName: string;
	  }>;

export class ReleaseCandidateCompatibilityError extends Error {
	constructor(
		readonly issue: ReleaseCandidateCompatibilityIssue,
		readonly unavailableReadModelTables: readonly string[] = [],
	) {
		super(releaseCandidateCompatibilityMessage(issue));
		this.name = 'ReleaseCandidateCompatibilityError';
	}
}

export function releaseCandidateCompatibilityStatus(
	issue: ReleaseCandidateCompatibilityIssue,
): 'platform-mismatch' | 'derived-source-incompatible' {
	return issue.kind.startsWith('platform-')
		? 'platform-mismatch'
		: 'derived-source-incompatible';
}

function releaseCandidateCompatibilityMessage(
	issue: ReleaseCandidateCompatibilityIssue,
): string {
	if (issue.kind === 'webview-card-unresolved') {
		return `Cannot resolve WebView gacha card: ${issue.gachaSeriesId}:${issue.rateIndex}:${issue.cardIndex}`;
	}
	if (issue.kind === 'derived-master-table-unavailable') {
		return `Derived source ${issue.source} requires ${issue.tableLabel}`;
	}
	if (issue.kind === 'derived-master-field-unavailable') {
		return `Derived source ${issue.source} requires ${issue.tableLabel}:${issue.fieldName}`;
	}
	return `Release pair ${issue.kind}: ${issue.tableLabel}`;
}
