type GachaPurchasePlanProvenance = {
	masterReleaseId?: string;
};

export function resolveGachaPurchaseSourceMasterReleaseId(
	purchasePlan: GachaPurchasePlanProvenance | undefined,
	resolveRequestMasterReleaseId: () => string,
): string {
	return purchasePlan?.masterReleaseId ?? resolveRequestMasterReleaseId();
}
