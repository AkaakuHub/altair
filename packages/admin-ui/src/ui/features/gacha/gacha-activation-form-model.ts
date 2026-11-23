import type {
	GachaSeriesSummary,
	SelectTicketSeriesSummary,
} from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type {
	AdminGachaSeriesActivation,
	AdminSelectTicketSeriesActivation,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { filterGachaSeriesByQuery } from './gacha-series-view.ts';
export type GachaActivationForm = Record<number, boolean>;
export type SelectTicketActivationForm = Record<number, boolean>;
export function createGachaActivationForm(
	items: AdminGachaSeriesActivation[],
): GachaActivationForm {
	return Object.fromEntries(
		items.map((item) => [item.gachaSeriesId, item.isEnabled]),
	);
}
export function createSelectTicketActivationForm(
	items: AdminSelectTicketSeriesActivation[],
): SelectTicketActivationForm {
	return Object.fromEntries(
		items.map((item) => [item.selectTicketSeriesId, item.isEnabled]),
	);
}
export function filterGachaSeries(
	items: GachaSeriesSummary[],
	form: GachaActivationForm,
	query: string,
	activeOnly: boolean,
) {
	return filterGachaSeriesByQuery(
		items.filter((item) => !activeOnly || (form[item.gachaSeriesId] ?? false)),
		query,
	);
}
export function filterSelectTicketSeries(
	items: SelectTicketSeriesSummary[],
	form: SelectTicketActivationForm,
	query: string,
	activeOnly: boolean,
) {
	const q = query.trim().toLowerCase();
	return items.filter(
		(item) =>
			(!activeOnly || (form[item.selectTicketSeriesId] ?? false)) &&
			(q.length === 0 ||
				`${item.selectTicketSeriesId} ${item.exchangeTicketId} ${item.startTime} ${item.endTime}`
					.toLowerCase()
					.includes(q)),
	);
}
export function getChangedGachaActivations(
	items: GachaSeriesSummary[],
	current: AdminGachaSeriesActivation[],
	form: GachaActivationForm,
) {
	const map = new Map(
		current.map((item) => [item.gachaSeriesId, item.isEnabled]),
	);
	return items
		.filter(
			(item) =>
				(form[item.gachaSeriesId] ?? false) !==
				(map.get(item.gachaSeriesId) ?? false),
		)
		.map((item) => ({
			gachaSeriesId: item.gachaSeriesId,
			isEnabled: form[item.gachaSeriesId] ?? false,
		}));
}
export function getChangedSelectTicketActivations(
	items: SelectTicketSeriesSummary[],
	current: AdminSelectTicketSeriesActivation[],
	form: SelectTicketActivationForm,
) {
	const map = new Map(
		current.map((item) => [item.selectTicketSeriesId, item.isEnabled]),
	);
	return items
		.filter(
			(item) =>
				(form[item.selectTicketSeriesId] ?? false) !==
				(map.get(item.selectTicketSeriesId) ?? false),
		)
		.map((item) => ({
			selectTicketSeriesId: item.selectTicketSeriesId,
			isEnabled: form[item.selectTicketSeriesId] ?? false,
		}));
}
