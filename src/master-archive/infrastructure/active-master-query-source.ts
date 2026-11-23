import ts from 'typescript-compiler-api';

type ActiveMasterQuery = Readonly<{ source: string; sql: string }>;

const activeDatabaseTablePattern =
	/\b(?:master_[a-z0-9_]+|archive_(?:list|detail|filterable_character|sortable_field)|with_station_(?:list|detail)|top_webview_gacha_[a-z0-9_]+)\b/u;

export async function collectActiveMasterQueries(
	root: string,
	pattern = 'src/**/*.ts',
): Promise<ActiveMasterQuery[]> {
	const queries: ActiveMasterQuery[] = [];
	const glob = new Bun.Glob(pattern);
	for await (const path of glob.scan({ cwd: root })) {
		if (path.includes('/master-archive/infrastructure/')) continue;
		const text = await Bun.file(`${root}/${path}`).text();
		if (!text.includes('.query')) continue;
		const sourceFile = ts.createSourceFile(
			path,
			text,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		visit(sourceFile, (node) => {
			if (!isDatabaseQueryCall(node)) return;
			const argument = node.arguments[0];
			if (argument === undefined) return;
			const enclosingFunction = findEnclosingFunction(node);
			const callBindings = enclosingFunction
				? findLiteralCallBindings(sourceFile, enclosingFunction)
				: [];
			const evaluated =
				callBindings.length > 0
					? callBindings.flatMap((bindings) =>
							evaluateSqlExpression(argument, sourceFile, new Set(), bindings),
						)
					: evaluateSqlExpression(argument, sourceFile, new Set(), new Map());
			const activeDatabaseQueries = evaluated.filter((sql) =>
				activeDatabaseTablePattern.test(sql),
			);
			if (
				activeDatabaseQueries.length === 0 &&
				(path.startsWith('src/v1/active-master-database/') ||
					activeDatabaseTablePattern.test(argument.getText(sourceFile)))
			) {
				throw new Error(
					`Unresolved active master query: ${location(path, sourceFile, node)}`,
				);
			}
			for (const sql of activeDatabaseQueries) {
				queries.push({
					source: location(path, sourceFile, node),
					sql: normalizeSql(sql),
				});
			}
		});
	}
	return [
		...new Map(
			queries.map((query) => [`${query.source}\0${query.sql}`, query]),
		).values(),
	].sort((left, right) =>
		`${left.source}\0${left.sql}`.localeCompare(
			`${right.source}\0${right.sql}`,
		),
	);
}

export function collectDerivedActiveDatabaseQueryColumns(
	queries: readonly ActiveMasterQuery[],
	officialTableNames: ReadonlySet<string>,
): ReadonlyMap<string, ReadonlySet<string>> {
	const derivedColumns = new Map<string, Set<string>>();
	for (const query of queries) {
		const identifiers = query.sql.match(/[a-z][a-z0-9_]*/giu) ?? [];
		for (const match of query.sql.matchAll(
			/\b(?:FROM|JOIN)\s+([a-z][a-z0-9_]*)/giu,
		)) {
			const tableName = match[1];
			if (tableName === undefined || officialTableNames.has(tableName))
				continue;
			const columns = derivedColumns.get(tableName) ?? new Set<string>();
			for (const identifier of identifiers) columns.add(identifier);
			derivedColumns.set(tableName, columns);
		}
	}
	return derivedColumns;
}

function visit(node: ts.Node, visitor: (node: ts.Node) => void): void {
	visitor(node);
	node.forEachChild((child) => visit(child, visitor));
}

function isDatabaseQueryCall(node: ts.Node): node is ts.CallExpression {
	return (
		ts.isCallExpression(node) &&
		ts.isPropertyAccessExpression(node.expression) &&
		node.expression.name.text === 'query'
	);
}

function evaluateSqlExpression(
	expression: ts.Expression,
	sourceFile: ts.SourceFile,
	seen: Set<ts.Node>,
	bindings: ReadonlyMap<string, string>,
): string[] {
	if (seen.has(expression)) return [];
	seen.add(expression);
	if (ts.isStringLiteralLike(expression)) return [expression.text];
	if (ts.isTemplateExpression(expression)) {
		let values = [expression.head.text];
		for (const span of expression.templateSpans) {
			const replacements = templateReplacements(
				span.expression,
				sourceFile,
				bindings,
			);
			values = values.flatMap((prefix) =>
				replacements.map(
					(replacement) => `${prefix}${replacement}${span.literal.text}`,
				),
			);
		}
		return values;
	}
	if (
		ts.isCallExpression(expression) &&
		ts.isPropertyAccessExpression(expression.expression) &&
		expression.expression.name.text === 'join' &&
		ts.isArrayLiteralExpression(expression.expression.expression)
	) {
		const separator = expression.arguments[0];
		const joiner =
			separator && ts.isStringLiteralLike(separator) ? separator.text : ',';
		let values = [''];
		for (const element of expression.expression.expression.elements) {
			const parts = ts.isSpreadElement(element)
				? [
						evaluateSqlArrayElements(
							element.expression,
							sourceFile,
							seen,
							bindings,
						).join(joiner),
					]
				: evaluateSqlExpression(element, sourceFile, seen, bindings);
			values = values.flatMap((prefix) =>
				parts.map((part) =>
					prefix.length === 0 ? part : `${prefix}${joiner}${part}`,
				),
			);
		}
		return values;
	}
	if (ts.isIdentifier(expression)) {
		const bound = bindings.get(expression.text);
		if (bound !== undefined) return [bound];
		const declaration = findValueDeclaration(sourceFile, expression.text);
		return declaration?.initializer
			? evaluateSqlExpression(
					declaration.initializer,
					sourceFile,
					seen,
					bindings,
				)
			: [];
	}
	if (
		ts.isCallExpression(expression) &&
		ts.isIdentifier(expression.expression)
	) {
		const declaration = findFunctionDeclaration(
			sourceFile,
			expression.expression.text,
		);
		if (!declaration?.body) return [];
		const localBindings = new Map(bindings);
		for (const [index, parameter] of declaration.parameters.entries()) {
			if (!ts.isIdentifier(parameter.name)) continue;
			const argument = expression.arguments[index];
			if (argument && ts.isStringLiteralLike(argument)) {
				localBindings.set(parameter.name.text, argument.text);
			}
		}
		const results: string[] = [];
		visit(declaration.body, (node) => {
			if (ts.isReturnStatement(node) && node.expression) {
				results.push(
					...evaluateSqlExpression(
						node.expression,
						sourceFile,
						seen,
						localBindings,
					),
				);
			}
		});
		return results;
	}
	return [];
}

function evaluateSqlArrayElements(
	expression: ts.Expression,
	sourceFile: ts.SourceFile,
	seen: Set<ts.Node>,
	bindings: ReadonlyMap<string, string>,
): string[] {
	if (seen.has(expression)) return [];
	seen.add(expression);
	if (ts.isArrayLiteralExpression(expression)) {
		return expression.elements.flatMap((element) =>
			ts.isSpreadElement(element)
				? evaluateSqlArrayElements(
						element.expression,
						sourceFile,
						seen,
						bindings,
					)
				: evaluateSqlExpression(element, sourceFile, seen, bindings),
		);
	}
	if (ts.isIdentifier(expression)) {
		const declaration = findValueDeclaration(sourceFile, expression.text);
		return declaration?.initializer
			? evaluateSqlArrayElements(
					declaration.initializer,
					sourceFile,
					seen,
					bindings,
				)
			: [];
	}
	if (
		ts.isCallExpression(expression) &&
		ts.isPropertyAccessExpression(expression.expression) &&
		expression.expression.name.text === 'map'
	) {
		const callback = expression.arguments[0];
		if (
			callback &&
			(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
		) {
			const callbackBindings = new Map(bindings);
			for (const parameter of callback.parameters) {
				if (ts.isIdentifier(parameter.name)) {
					callbackBindings.set(parameter.name.text, '0');
				}
			}
			if (ts.isExpression(callback.body)) {
				return evaluateSqlExpression(
					callback.body,
					sourceFile,
					seen,
					callbackBindings,
				);
			}
		}
	}
	return [];
}

function templateReplacements(
	expression: ts.Expression,
	sourceFile: ts.SourceFile,
	bindings: ReadonlyMap<string, string>,
): string[] {
	if (ts.isIdentifier(expression)) {
		const bound = bindings.get(expression.text);
		if (bound !== undefined) return [bound];
		const literals = findStringLiteralUnion(sourceFile, expression.text);
		if (literals.length > 0) return literals;
		const declaration = findValueDeclaration(sourceFile, expression.text);
		if (declaration?.initializer) {
			const evaluated = evaluateSqlExpression(
				declaration.initializer,
				sourceFile,
				new Set(),
				bindings,
			);
			if (evaluated.length > 0) return evaluated;
		}
		return [''];
	}
	return ['?'];
}

function findEnclosingFunction(
	node: ts.Node,
): ts.FunctionDeclaration | undefined {
	let current: ts.Node | undefined = node.parent;
	while (current) {
		if (ts.isFunctionDeclaration(current)) return current;
		current = current.parent;
	}
	return undefined;
}

function findLiteralCallBindings(
	sourceFile: ts.SourceFile,
	declaration: ts.FunctionDeclaration,
): ReadonlyMap<string, string>[] {
	const name = declaration.name?.text;
	if (!name) return [];
	const bindings: ReadonlyMap<string, string>[] = [];
	visit(sourceFile, (node) => {
		if (
			!ts.isCallExpression(node) ||
			!ts.isIdentifier(node.expression) ||
			node.expression.text !== name
		) {
			return;
		}
		const values = new Map<string, string>();
		for (const [index, parameter] of declaration.parameters.entries()) {
			if (!ts.isIdentifier(parameter.name)) continue;
			const argument = node.arguments[index];
			if (argument && ts.isStringLiteralLike(argument)) {
				values.set(parameter.name.text, argument.text);
			}
		}
		if (values.size > 0) bindings.push(values);
	});
	return bindings;
}

function findValueDeclaration(
	sourceFile: ts.SourceFile,
	name: string,
): ts.VariableDeclaration | undefined {
	let found: ts.VariableDeclaration | undefined;
	visit(sourceFile, (node) => {
		if (
			!found &&
			ts.isVariableDeclaration(node) &&
			ts.isIdentifier(node.name) &&
			node.name.text === name
		) {
			found = node;
		}
	});
	return found;
}

function findFunctionDeclaration(
	sourceFile: ts.SourceFile,
	name: string,
): ts.FunctionDeclaration | undefined {
	return sourceFile.statements.find(
		(statement): statement is ts.FunctionDeclaration =>
			ts.isFunctionDeclaration(statement) && statement.name?.text === name,
	);
}

function findStringLiteralUnion(
	sourceFile: ts.SourceFile,
	name: string,
): string[] {
	const values: string[] = [];
	visit(sourceFile, (node) => {
		if (
			!ts.isParameter(node) ||
			!ts.isIdentifier(node.name) ||
			node.name.text !== name
		) {
			return;
		}
		const types =
			node.type && ts.isUnionTypeNode(node.type)
				? node.type.types
				: node.type
					? [node.type]
					: [];
		for (const type of types) {
			if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) {
				values.push(type.literal.text);
			}
		}
	});
	return values;
}

function location(
	path: string,
	sourceFile: ts.SourceFile,
	node: ts.Node,
): string {
	return `${path}:${sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1}`;
}

function normalizeSql(sql: string): string {
	return sql.replace(/\s+/gu, ' ').trim();
}
