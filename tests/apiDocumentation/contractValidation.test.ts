import { expect, test } from 'bun:test';
import { createContractValidator } from '../../tools/apiDocumentation/contractValidation.ts';

test('同じ参照を繰り返し検証し、別の契約と混同しない', () => {
	const validate = createContractValidator({
		Number: { type: 'number' },
		Text: { type: 'string' },
	});
	const number = { $ref: '#/components/schemas/Number' };
	const text = { $ref: '#/components/schemas/Text' };
	expect(() => validate(number, 1)).not.toThrow();
	expect(() => validate(number, '1')).toThrow();
	expect(() => validate(text, '1')).not.toThrow();
	expect(() => validate(text, 1)).toThrow();
	expect(() => validate(number, 2)).not.toThrow();
});
