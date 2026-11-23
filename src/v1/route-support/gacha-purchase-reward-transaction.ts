type GachaPurchaseTransaction<T> = {
	applyReceipt: () => T | undefined;
	consumeCost: () => void;
	recordPaidOnlyProgress?: () => void;
	consumeStoredPlan?: () => void;
};

export function runGachaPurchaseRewardTransaction<T>(
	transaction: GachaPurchaseTransaction<T>,
): T | undefined {
	const result = transaction.applyReceipt();
	if (result === undefined) return undefined;
	transaction.consumeCost();
	transaction.recordPaidOnlyProgress?.();
	transaction.consumeStoredPlan?.();
	return result;
}
