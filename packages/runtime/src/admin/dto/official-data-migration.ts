export type OfficialDataMigrationCategoryStatus =
	| 'captured'
	| 'missing'
	| 'not_applied';

export type OfficialDataMigrationCategoryPreview = {
	category: string;
	sourceEndpoint: string;
	status: OfficialDataMigrationCategoryStatus;
	responseCount: number;
	appliesToState: boolean;
};

export type OfficialDataMigrationPreview = {
	formatVersion: number;
	playerId: string | null;
	deviceSpecificId: string | null;
	createdAtUtc: string | null;
	totalEvents: number;
	categories: OfficialDataMigrationCategoryPreview[];
	errors: string[];
};

export type OfficialDataMigrationApplyResult = {
	playerId: string;
	appliedCategories: string[];
	skippedCategories: string[];
	errors: string[];
};
