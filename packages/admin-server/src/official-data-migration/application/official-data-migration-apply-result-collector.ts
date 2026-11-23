type OfficialDataMigrationApplyCategoryResult = {
	appliedCategories: string[];
	errors: string[];
};

type OfficialDataMigrationApplyResultCollector = {
	addCategory: (category: string) => void;
	addCategories: (categories: readonly string[]) => void;
	addError: (error: string) => void;
	result: OfficialDataMigrationApplyCategoryResult;
};

export function createOfficialDataMigrationApplyResultCollector(dump: {
	preview: { errors: readonly string[] };
}): OfficialDataMigrationApplyResultCollector {
	const result = {
		appliedCategories: [] as string[],
		errors: [...dump.preview.errors],
	};
	return {
		addCategory: (category) => result.appliedCategories.push(category),
		addCategories: (categories) => result.appliedCategories.push(...categories),
		addError: (error) => result.errors.push(error),
		result,
	};
}
