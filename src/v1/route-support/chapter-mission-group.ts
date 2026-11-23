export function getChapterMissionGroup(
	categoryId: number,
	grandPrixType: number,
): number {
	if (categoryId !== 3) {
		return 0;
	}
	switch (grandPrixType) {
		case 1:
			return 1;
		case 2:
			return 3;
		default:
			return 2;
	}
}
