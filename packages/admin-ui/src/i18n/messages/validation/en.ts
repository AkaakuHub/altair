export const en = {
	httpFailure: (status: number, message: string) =>
		`Admin operation failed (HTTP${status}). ${message}`,
	reloadFailure: (committed: string, message: string) =>
		`${committed} Reloading the latest state also failed. ${message}`,
	quantity: (minimum: number, maximum: number) =>
		`Enter a whole number between ${minimum} and ${maximum} for the quantity.`,
	stars: 'Enter a non-negative whole number of stars.',
	required: (label: string) => `Enter ${label}.`,
	number: (label: string) => `Enter a number for ${label}.`,
	integer: (label: string) => `Enter a valid integer for ${label}.`,
	dateTime: 'Enter a valid date and time.',
	localTime: 'The specified local time is not available.',
	savedDateTime: 'Could not load the saved date and time.',
};
