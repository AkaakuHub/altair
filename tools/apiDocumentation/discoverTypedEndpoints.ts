import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript-compiler-api';

export type ContractTypeSource = Readonly<{ name: string; module: string }>;
export type TypedEndpointSource = Readonly<{
	method: string;
	path: string;
	request: ContractTypeSource;
	response: ContractTypeSource;
	requiresSession: boolean;
}>;

function callOf(
	statement: ts.Statement | undefined,
): ts.CallExpression | undefined {
	return statement !== undefined &&
		ts.isExpressionStatement(statement) &&
		ts.isCallExpression(statement.expression)
		? statement.expression
		: undefined;
}

function readRoute(
	call: ts.CallExpression | undefined,
): Readonly<{ methods: string[]; path: string }> {
	if (call === undefined || !ts.isPropertyAccessExpression(call.expression))
		throw new Error('A typed endpoint marker must immediately precede a route');
	const method = call.expression.name.text;
	const path = call.arguments[method === 'on' ? 1 : 0];
	if (
		path === undefined ||
		!ts.isStringLiteral(path) ||
		!path.text.startsWith('/v1/')
	)
		throw new Error('Typed endpoint must have a literal game API path');
	if (method !== 'on') {
		if (
			!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(
				method,
			)
		)
			throw new Error(`Unsupported typed endpoint method: ${method}`);
		return { methods: [method], path: path.text };
	}
	const methods = call.arguments[0];
	if (methods === undefined || !ts.isArrayLiteralExpression(methods))
		throw new Error('Typed endpoint methods must be a literal array');
	return {
		methods: methods.elements.map((element) => {
			if (!ts.isStringLiteral(element))
				throw new Error('Typed endpoint method must be a string');
			return element.text.toLowerCase();
		}),
		path: path.text,
	};
}

function readTypeSources(
	source: ts.SourceFile,
): Map<string, ContractTypeSource> {
	const types = new Map<string, ContractTypeSource>();
	for (const statement of source.statements) {
		if (
			ts.isImportDeclaration(statement) &&
			ts.isStringLiteral(statement.moduleSpecifier)
		) {
			const bindings = statement.importClause?.namedBindings;
			if (bindings === undefined || !ts.isNamedImports(bindings)) continue;
			if (!statement.moduleSpecifier.text.startsWith('.')) continue;
			const module = resolve(
				dirname(source.fileName),
				statement.moduleSpecifier.text,
			);
			for (const element of bindings.elements)
				types.set(element.name.text, {
					name: element.propertyName?.text ?? element.name.text,
					module,
				});
		} else if (
			ts.isTypeAliasDeclaration(statement) ||
			ts.isInterfaceDeclaration(statement)
		) {
			types.set(statement.name.text, {
				name: statement.name.text,
				module: source.fileName,
			});
		}
	}
	return types;
}

export function discoverFileTypedEndpoints(
	file: string,
	text: string,
): TypedEndpointSource[] {
	const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
	const types = readTypeSources(source);
	const endpoints: TypedEndpointSource[] = [];
	function contract(node: ts.TypeNode | undefined): ContractTypeSource {
		if (
			node === undefined ||
			!ts.isTypeReferenceNode(node) ||
			!ts.isIdentifier(node.typeName) ||
			node.typeArguments !== undefined
		)
			throw new Error(
				`Typed endpoint must reference a named contract: ${file}`,
			);
		const result = types.get(node.typeName.text);
		if (result === undefined)
			throw new Error(`Contract import is missing: ${node.typeName.text}`);
		return result;
	}
	function visit(node: ts.Node): void {
		if (ts.isBlock(node) || ts.isSourceFile(node)) {
			node.statements.forEach((statement, index) => {
				const marker = callOf(statement);
				if (
					marker === undefined ||
					!ts.isIdentifier(marker.expression) ||
					!['apkDumpTypedEndpoint', 'typedEndpoint'].includes(
						marker.expression.text,
					)
				)
					return;
				if (marker.typeArguments?.length !== 2)
					throw new Error(
						`Endpoint marker requires request and response: ${file}`,
					);
				const documentation = marker.arguments[0];
				let requiresSession = false;
				if (documentation !== undefined) {
					if (
						!ts.isObjectLiteralExpression(documentation) ||
						documentation.properties.length !== 1
					)
						throw new Error(
							'Endpoint documentation must declare requiresSession',
						);
					const property = documentation.properties[0];
					if (
						property === undefined ||
						!ts.isPropertyAssignment(property) ||
						property.name.getText(source) !== 'requiresSession' ||
						property.initializer.kind !== ts.SyntaxKind.TrueKeyword
					)
						throw new Error('Endpoint session requirement must be true');
					requiresSession = true;
				}
				const route = readRoute(callOf(node.statements[index + 1]));
				for (const method of route.methods)
					endpoints.push({
						method,
						path: route.path,
						request: contract(marker.typeArguments[0]),
						response: contract(marker.typeArguments[1]),
						requiresSession,
					});
			});
		}
		ts.forEachChild(node, visit);
	}
	visit(source);
	return endpoints;
}

export async function discoverTypedEndpoints(
	directory: string,
): Promise<TypedEndpointSource[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const results = await Promise.all(
		entries
			.sort((a, b) => a.name.localeCompare(b.name))
			.map(async (entry) => {
				const path = join(directory, entry.name);
				if (entry.isDirectory()) return discoverTypedEndpoints(path);
				return entry.name.endsWith('.ts')
					? discoverFileTypedEndpoints(path, await readFile(path, 'utf8'))
					: [];
			}),
	);
	return results.flat();
}
