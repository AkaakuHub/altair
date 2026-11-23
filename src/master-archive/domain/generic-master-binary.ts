const masterBinaryFieldTypes = {
	string: 0x10,
	int32: 0x20,
	int64: 0x33,
} as const;

type MasterBinaryFieldTypeName = keyof typeof masterBinaryFieldTypes;

export type GenericMasterField = Readonly<{
	index: number;
	crc: number;
	typeCode: number;
	typeName: MasterBinaryFieldTypeName | null;
	officialFieldName: string | null;
}>;

export type GenericMasterCell =
	| Readonly<{ kind: 'string'; value: string }>
	| Readonly<{ kind: 'int32'; value: number; encodedUnsigned: string }>
	| Readonly<{ kind: 'int64'; value: string }>;

export function genericMasterInt32CellFromSignedValue(
	value: number,
): Extract<GenericMasterCell, { kind: 'int32' }> {
	if (
		!Number.isInteger(value) ||
		value < -2_147_483_648 ||
		value > 2_147_483_647
	) {
		throw new Error('Master int32 value is outside the signed 32-bit range');
	}
	return genericMasterInt32CellFromEncodedUnsigned(
		BigInt.asUintN(64, BigInt(value)),
	);
}

function genericMasterInt32CellFromEncodedUnsigned(
	encoded: bigint,
): Extract<GenericMasterCell, { kind: 'int32' }> {
	if (encoded < 0n || encoded > (1n << 64n) - 1n) {
		throw new Error('Master int32 encoding is outside the uint64 range');
	}
	return {
		kind: 'int32',
		value: Number(BigInt.asIntN(32, encoded)),
		encodedUnsigned: encoded.toString(),
	};
}

export type GenericMasterRow = Readonly<{
	index: number;
	cells: readonly GenericMasterCell[];
}>;

export type GenericMasterTable = Readonly<{
	header: Readonly<{
		magic: 'da00';
		formatBytes: readonly [number, number];
	}>;
	rowCount: number;
	fieldCount: number;
	fields: readonly GenericMasterField[];
	rows: readonly GenericMasterRow[];
}>;

type MasterFieldNameResolver = (input: {
	tableLabel: string;
	fieldIndex: number;
	fieldCrc: number;
	typeCode: number;
}) => string | null;

export type MasterBinaryDecodeReport =
	| Readonly<{
			status: 'decoded';
			tableLabel: string;
			byteLength: number;
			consumedByteLength: number;
			rowCount: number;
			fieldCount: number;
			fields: readonly GenericMasterField[];
			unknownFieldCrcs: readonly number[];
	  }>
	| Readonly<{
			status: 'failed';
			tableLabel: string;
			byteLength: number;
			consumedByteLength: number;
			code:
				| 'invalid-magic'
				| 'invalid-string'
				| 'invalid-varuint'
				| 'unsupported-field-type'
				| 'truncated-binary'
				| 'trailing-bytes';
			message: string;
			fields: readonly GenericMasterField[];
	  }>;

type DecodedMasterBinary = Readonly<{
	table: GenericMasterTable;
	report: Extract<MasterBinaryDecodeReport, { status: 'decoded' }>;
}>;

export class MasterBinaryDecodeError extends Error {
	constructor(
		message: string,
		readonly report: Extract<MasterBinaryDecodeReport, { status: 'failed' }>,
	) {
		super(message);
		this.name = 'MasterBinaryDecodeError';
	}
}

export function decodeGenericMasterBinary(
	tableLabel: string,
	bytes: Uint8Array,
	resolveFieldName: MasterFieldNameResolver = () => null,
): DecodedMasterBinary {
	const reader = new MasterBinaryReader(bytes, tableLabel);
	const fields: GenericMasterField[] = [];
	try {
		if (reader.readUint8() !== 0xda || reader.readUint8() !== 0x00) {
			throw reader.failure('invalid-magic', 'Master binary magic must be DA00');
		}
		const formatBytes = [reader.readUint8(), reader.readUint8()] as const;
		const rowCount = reader.readCount();
		const fieldCount = reader.readCount();
		for (let index = 0; index < fieldCount; index += 1) {
			const crc = reader.readUint32();
			const typeCode = reader.readUint32();
			fields.push({
				index,
				crc,
				typeCode,
				typeName: fieldTypeName(typeCode),
				officialFieldName: resolveFieldName({
					tableLabel,
					fieldIndex: index,
					fieldCrc: crc,
					typeCode,
				}),
			});
		}
		const unsupported = fields.find((field) => field.typeName === null);
		if (unsupported !== undefined) {
			throw reader.failure(
				'unsupported-field-type',
				`Unsupported master field type: 0x${unsupported.typeCode.toString(16)}`,
				fields,
			);
		}
		const rows: Array<{ index: number; cells: GenericMasterCell[] }> =
			Array.from({ length: rowCount }, (_, index) => ({ index, cells: [] }));
		for (const field of fields) {
			for (const row of rows) {
				row.cells.push(readCell(reader, requiredTypeName(field)));
			}
		}
		if (!reader.complete) {
			throw reader.failure(
				'trailing-bytes',
				'Master binary contains trailing bytes',
				fields,
			);
		}
		const report = {
			status: 'decoded' as const,
			tableLabel,
			byteLength: bytes.length,
			consumedByteLength: reader.offset,
			rowCount,
			fieldCount,
			fields,
			unknownFieldCrcs: fields
				.filter((field) => field.officialFieldName === null)
				.map((field) => field.crc),
		};
		return {
			table: {
				header: { magic: 'da00', formatBytes },
				rowCount,
				fieldCount,
				fields,
				rows,
			},
			report,
		};
	} catch (error) {
		if (error instanceof MasterBinaryDecodeError) throw error;
		if (error instanceof BinaryReadError) {
			throw new MasterBinaryDecodeError(
				error.message,
				reader.failureReport(error.code, error.message, fields),
			);
		}
		throw error;
	}
}

function fieldTypeName(typeCode: number): MasterBinaryFieldTypeName | null {
	if (typeCode === masterBinaryFieldTypes.string) return 'string';
	if (typeCode === masterBinaryFieldTypes.int32) return 'int32';
	if (typeCode === masterBinaryFieldTypes.int64) return 'int64';
	return null;
}

function requiredTypeName(
	field: GenericMasterField,
): MasterBinaryFieldTypeName {
	if (field.typeName === null) throw new Error('Field type was not validated');
	return field.typeName;
}

function readCell(
	reader: MasterBinaryReader,
	typeName: MasterBinaryFieldTypeName,
): GenericMasterCell {
	if (typeName === 'string')
		return { kind: 'string', value: reader.readString() };
	if (typeName === 'int32') {
		const encoded = reader.readVarUint();
		return genericMasterInt32CellFromEncodedUnsigned(encoded);
	}
	return { kind: 'int64', value: reader.readInt64().toString() };
}

type DecodeFailureCode = Extract<
	MasterBinaryDecodeReport,
	{ status: 'failed' }
>['code'];

class BinaryReadError extends Error {
	constructor(
		readonly code: 'invalid-string' | 'invalid-varuint' | 'truncated-binary',
		message: string,
	) {
		super(message);
	}
}

class MasterBinaryReader {
	offset = 0;

	constructor(
		private readonly bytes: Uint8Array,
		private readonly tableLabel = '',
	) {}

	get complete(): boolean {
		return this.offset === this.bytes.length;
	}

	readUint8(): number {
		const value = this.bytes[this.offset];
		if (value === undefined) {
			throw new BinaryReadError(
				'truncated-binary',
				'Master binary ended unexpectedly',
			);
		}
		this.offset += 1;
		return value;
	}

	readUint32(): number {
		let value = 0;
		for (let index = 0; index < 4; index += 1) {
			value = value * 256 + this.readUint8();
		}
		return value;
	}

	readInt64(): bigint {
		let value = 0n;
		for (let index = 0; index < 8; index += 1) {
			value = (value << 8n) | BigInt(this.readUint8());
		}
		return BigInt.asIntN(64, value);
	}

	readCount(): number {
		const value = this.readVarUint();
		if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
			throw new BinaryReadError(
				'invalid-varuint',
				'Master binary count exceeds the safe integer range',
			);
		}
		return Number(value);
	}

	readVarUint(): bigint {
		let value = 0n;
		for (let index = 0; index < 10; index += 1) {
			const byte = this.readUint8();
			if (index === 9 && byte > 1) {
				throw new BinaryReadError(
					'invalid-varuint',
					'Master binary varuint exceeds uint64',
				);
			}
			value |= BigInt(byte & 0x7f) << BigInt(index * 7);
			if ((byte & 0x80) === 0) return value;
		}
		throw new BinaryReadError(
			'invalid-varuint',
			'Master binary varuint is unterminated',
		);
	}

	readString(): string {
		const start = this.offset;
		while (this.readUint8() !== 0) {}
		try {
			return new TextDecoder('utf-8', { fatal: true }).decode(
				this.bytes.subarray(start, this.offset - 1),
			);
		} catch {
			throw new BinaryReadError(
				'invalid-string',
				'Master string is not valid UTF-8',
			);
		}
	}

	failure(
		code: DecodeFailureCode,
		message: string,
		fields: readonly GenericMasterField[] = [],
	): MasterBinaryDecodeError {
		return new MasterBinaryDecodeError(
			message,
			this.failureReport(code, message, fields),
		);
	}

	failureReport(
		code: DecodeFailureCode,
		message: string,
		fields: readonly GenericMasterField[],
	): Extract<MasterBinaryDecodeReport, { status: 'failed' }> {
		return {
			status: 'failed',
			tableLabel: this.tableLabel,
			byteLength: this.bytes.length,
			consumedByteLength: this.offset,
			code,
			message,
			fields,
		};
	}
}
