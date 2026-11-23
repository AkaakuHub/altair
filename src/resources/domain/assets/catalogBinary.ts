export type BinaryCatalogEntry = {
	priority: number;
	resourceType: number;
	size: number;
	type: string;
	contents: Array<{ label: string; type: string }>;
	categories: string[];
	label: string;
	dependencies: string[];
	checksum: bigint;
	encryptionSalt: bigint;
};

export type BinaryCatalog = {
	version: number;
	entries: BinaryCatalogEntry[];
};

const catalogMagic = 0xca01;
const maximumUint64 = 0xffffffffffffffffn;

export function encodeCatalogBinary(catalog: BinaryCatalog): Uint8Array {
	assertUnsignedInteger(catalog.version, 0xffff, 'catalog version');
	const writer = new BinaryWriter();
	writer.writeUint16(catalogMagic);
	writer.writeUint16(catalog.version);
	writer.writeVarUint(catalog.entries.length);
	writeNumberField(writer, catalog.entries, 'priority');
	writeNumberField(writer, catalog.entries, 'resourceType');
	for (const entry of catalog.entries)
		writer.writeVarUint(entry.dependencies.length);
	for (const entry of catalog.entries)
		writer.writeVarUint(entry.contents.length);
	for (const entry of catalog.entries)
		writer.writeVarUint(entry.categories.length);
	writeNumberField(writer, catalog.entries, 'size');
	for (const entry of catalog.entries) writer.writeString(entry.type);
	for (const entry of catalog.entries) {
		for (const content of entry.contents) writer.writeString(content.type);
	}
	for (const entry of catalog.entries) {
		for (const category of entry.categories) writer.writeString(category);
	}
	for (const entry of catalog.entries) writer.writeString(entry.label);
	for (const entry of catalog.entries) {
		for (const content of entry.contents) writer.writeString(content.label);
	}
	for (const entry of catalog.entries) {
		for (const dependency of entry.dependencies) writer.writeString(dependency);
	}
	for (const entry of catalog.entries) writer.writeUint64(entry.checksum);
	for (const entry of catalog.entries) writer.writeSalt(entry.encryptionSalt);
	return writer.toBytes();
}

export function decodeCatalogBinary(bytes: Uint8Array): BinaryCatalog {
	const reader = new BinaryReader(bytes);
	if (reader.readUint16() !== catalogMagic) {
		throw new Error('Catalog magic is invalid');
	}
	const version = reader.readUint16();
	const count = reader.readVarUint();
	const priorities = reader.readVarUintArray(count);
	const resourceTypes = reader.readVarUintArray(count);
	const dependencyCounts = reader.readVarUintArray(count);
	const contentCounts = reader.readVarUintArray(count);
	const categoryCounts = reader.readVarUintArray(count);
	const sizes = reader.readVarUintArray(count);
	const types = reader.readStringArray(count);
	const contentTypes = contentCounts.map((length) =>
		reader.readStringArray(length),
	);
	const categories = categoryCounts.map((length) =>
		reader.readStringArray(length),
	);
	const labels = reader.readStringArray(count);
	const contentLabels = contentCounts.map((length) =>
		reader.readStringArray(length),
	);
	const dependencies = dependencyCounts.map((length) =>
		reader.readStringArray(length),
	);
	const checksums = Array.from({ length: count }, () => reader.readUint64());
	const salts = Array.from({ length: count }, () => reader.readSalt());
	reader.assertComplete();
	return {
		version,
		entries: Array.from({ length: count }, (_, index) => ({
			priority: required(priorities[index]),
			resourceType: required(resourceTypes[index]),
			size: required(sizes[index]),
			type: required(types[index]),
			contents: required(contentLabels[index]).map((label, contentIndex) => ({
				label,
				type: required(required(contentTypes[index])[contentIndex]),
			})),
			categories: required(categories[index]),
			label: required(labels[index]),
			dependencies: required(dependencies[index]),
			checksum: required(checksums[index]),
			encryptionSalt: required(salts[index]),
		})),
	};
}

function writeNumberField(
	writer: BinaryWriter,
	entries: BinaryCatalogEntry[],
	field: 'priority' | 'resourceType' | 'size',
) {
	for (const entry of entries) writer.writeVarUint(entry[field]);
}

function required<Value>(value: Value | undefined): Value {
	if (value === undefined) {
		throw new Error('Catalog field is missing');
	}
	return value;
}

function assertUnsignedInteger(value: number, maximum: number, label: string) {
	if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
		throw new Error(`${label} is outside its unsigned integer range`);
	}
}

class BinaryWriter {
	private readonly bytes: number[] = [];
	writeUint16(value: number) {
		assertUnsignedInteger(value, 0xffff, 'uint16');
		this.bytes.push(value >>> 8, value & 0xff);
	}
	writeVarUint(value: number) {
		assertUnsignedInteger(value, Number.MAX_SAFE_INTEGER, 'varuint');
		let remaining = BigInt(value);
		do {
			const current = Number(remaining & 0x7fn);
			remaining >>= 7n;
			this.bytes.push(remaining === 0n ? current : current | 0x80);
		} while (remaining !== 0n);
	}
	writeString(value: string) {
		const encoded = new TextEncoder().encode(value);
		if (encoded.includes(0))
			throw new Error('Catalog strings cannot contain NUL');
		this.bytes.push(...encoded, 0);
	}
	writeUint64(value: bigint) {
		if (value < 0n || value > maximumUint64)
			throw new Error('uint64 is out of range');
		for (let shift = 56n; shift >= 0n; shift -= 8n) {
			this.bytes.push(Number((value >> shift) & 0xffn));
		}
	}
	writeSalt(value: bigint) {
		if (value === 0n) {
			this.bytes.push(0);
			return;
		}
		if (value < 0x0100000000000000n) {
			throw new Error('Non-zero catalog salt must have a non-zero first byte');
		}
		this.writeUint64(value);
	}
	toBytes() {
		return Uint8Array.from(this.bytes);
	}
}

class BinaryReader {
	private offset = 0;
	constructor(private readonly bytes: Uint8Array) {}
	readUint16() {
		return this.readByte() * 0x100 + this.readByte();
	}
	readVarUint() {
		let value = 0n;
		for (let shift = 0n; shift <= 63n; shift += 7n) {
			const byte = this.readByte();
			value |= BigInt(byte & 0x7f) << shift;
			if ((byte & 0x80) === 0) {
				const number = Number(value);
				assertUnsignedInteger(number, Number.MAX_SAFE_INTEGER, 'varuint');
				return number;
			}
		}
		throw new Error('Catalog varuint is too long');
	}
	readVarUintArray(length: number) {
		return Array.from({ length }, () => this.readVarUint());
	}
	readStringArray(length: number) {
		return Array.from({ length }, () => this.readString());
	}
	readString() {
		const start = this.offset;
		while (this.readByte() !== 0) {}
		return new TextDecoder('utf-8', { fatal: true }).decode(
			this.bytes.subarray(start, this.offset - 1),
		);
	}
	readUint64() {
		let value = 0n;
		for (let index = 0; index < 8; index += 1) {
			value = (value << 8n) | BigInt(this.readByte());
		}
		return value;
	}
	readSalt() {
		if (this.peekByte() === 0) {
			this.offset += 1;
			return 0n;
		}
		return this.readUint64();
	}
	assertComplete() {
		if (this.offset !== this.bytes.length)
			throw new Error('Catalog has trailing bytes');
	}
	private peekByte() {
		if (this.offset >= this.bytes.length)
			throw new Error('Catalog is truncated');
		return required(this.bytes[this.offset]);
	}
	private readByte() {
		const value = this.peekByte();
		this.offset += 1;
		return value;
	}
}
