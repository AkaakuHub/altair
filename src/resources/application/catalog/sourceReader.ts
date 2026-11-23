import type { BinaryCatalogEntry } from '../../domain/assets/catalogBinary.ts';

export type CatalogSourceReader = {
	read(): Promise<BinaryCatalogEntry[]>;
};
