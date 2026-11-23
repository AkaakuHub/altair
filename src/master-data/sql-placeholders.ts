export function sqlInPlaceholders(values: readonly unknown[]): string {
	return values.map(() => '?').join(', ');
}
