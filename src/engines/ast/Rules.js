import { ASTWalker } from './ASTWalker.js';

const walker = new ASTWalker();

function makeResult(ruleId, severity, message, node, snippet = '') {
    return { ruleId, severity, message, line: node?.line || 1, col: node?.col || 1, snippet };
}

export function runRules(ast, sourceLines, config = {}) {
    const results = [];
    const complexityThreshold = config.complexityThreshold ?? 10;
    const nestingThreshold = config.nestingThreshold ?? 4;

    const getLine = (line) => (sourceLines[line - 1] || '').trim().slice(0, 80);

    results.push(...ruleUnusedVars(ast, sourceLines, getLine));
    results.push(...ruleVarInBlock(ast, sourceLines, getLine));
    results.push(...ruleCyclomaticComplexity(ast, sourceLines, getLine, complexityThreshold));
    results.push(...ruleDeepNesting(ast, sourceLines, getLine, nestingThreshold));
    results.push(...ruleConsoleStatements(ast, sourceLines, getLine));
    results.push(...ruleAssignmentInCondition(ast, sourceLines, getLine));
    results.push(...ruleEvalUsage(ast, sourceLines, getLine));
    results.push(...rulePromiseMissingCatch(ast, sourceLines, getLine));
    results.push(...ruleAsyncWithoutTryCatch(ast, sourceLines, getLine));
    results.push(...ruleDuplicateObjectKeys(ast, sourceLines, getLine));
    results.push(...ruleLooseEquality(ast, sourceLines, getLine));
    results.push(...ruleUnreachableCode(ast, sourceLines, getLine));
    results.push(...ruleMissingStrictMode(ast, sourceLines, getLine));

    return results;
}

function ruleUnusedVars(ast, lines, getLine) {
    const results = [];
    const scopes = [{ decls: new Map(), refs: new Set() }];

    const declareVar = (name, node) => {
        scopes[scopes.length - 1].decls.set(name, node);
    };
    const referenceVar = (name) => {
        for (let i = scopes.length - 1; i >= 0; i--) {
            if (scopes[i].decls.has(name)) { scopes[i].decls.get(name).__used = true; return; }
        }
    };

    walker.walk(ast, {
        VariableDeclarator(node) {
            if (node.id?.name) declareVar(node.id.name, node.id);
        },
        Identifier(node) { referenceVar(node.name); },
        FunctionDeclaration(node) {
            if (node.id) declareVar(node.id.name, node.id);
            scopes.push({ decls: new Map(), refs: new Set() });
        },
    });

    for (const scope of scopes) {
        for (const [name, node] of scope.decls) {
            if (!node.__used && name !== '_' && !name.startsWith('_')) {
                results.push(makeResult('no-unused-vars', 'warning', `'${name}' is declared but never used.`, node, getLine(node.line)));
            }
        }
    }
    return results;
}

function ruleVarInBlock(ast, lines, getLine) {
    const results = [];
    let depth = 0;
    walker.walk(ast, {
        BlockStatement: { enter() { depth++; }, exit() { depth--; } },
        VariableDeclaration(node) {
            if (node.kind === 'var' && depth > 0) {
                results.push(makeResult('no-var', 'warning', `Use 'let' or 'const' instead of 'var' inside block scope.`, node, getLine(node.line)));
            }
        },
    });
    return results;
}

function countComplexity(fn) {
    let complexity = 1;
    walker.walk(fn.body, {
        IfStatement() { complexity++; },
        WhileStatement() { complexity++; },
        DoWhileStatement() { complexity++; },
        ForStatement() { complexity++; },
        ForInStatement() { complexity++; },
        ForOfStatement() { complexity++; },
        SwitchCase(node) { if (node.test) complexity++; },
        LogicalExpression(node) { if (node.operator === '&&' || node.operator === '||') complexity++; },
        ConditionalExpression() { complexity++; },
        CatchClause() { complexity++; },
    });
    return complexity;
}

function ruleCyclomaticComplexity(ast, lines, getLine, threshold) {
    const results = [];
    const checkFn = (node) => {
        const c = countComplexity(node);
        if (c > threshold) {
            const name = node.id?.name || '(anonymous)';
            results.push(makeResult('complexity', 'warning', `Function '${name}' has cyclomatic complexity of ${c} (threshold: ${threshold}).`, node, getLine(node.line)));
        }
    };
    walker.walk(ast, { FunctionDeclaration: checkFn, FunctionExpression: checkFn, ArrowFunctionExpression: checkFn });
    return results;
}

function ruleDeepNesting(ast, lines, getLine, threshold) {
    const results = [];
    let depth = 0;
    const blockTypes = new Set(['BlockStatement', 'IfStatement', 'WhileStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'DoWhileStatement', 'SwitchStatement']);
    walker.walk(ast, {
        '*'(node) {
            if (blockTypes.has(node.type)) {
                depth++;
                if (depth > threshold) {
                    results.push(makeResult('max-depth', 'warning', `Nesting depth of ${depth} exceeds threshold of ${threshold}.`, node, getLine(node.line)));
                }
            }
        },
    });
    return results;
}

function ruleConsoleStatements(ast, lines, getLine) {
    const results = [];
    walker.walk(ast, {
        CallExpression(node) {
            const c = node.callee;
            if (c?.type === 'MemberExpression' && c.object?.name === 'console') {
                results.push(makeResult('no-console', 'info', `Remove 'console.${c.property?.name}' before production.`, node, getLine(node.line)));
            }
        },
    });
    return results;
}

function ruleAssignmentInCondition(ast, lines, getLine) {
    const results = [];
    const checkCond = (test) => {
        if (!test) return;
        if (test.type === 'AssignmentExpression') {
            results.push(makeResult('no-cond-assign', 'error', `Assignment inside conditional. Use '===' for comparison.`, test, getLine(test.line)));
        }
    };
    walker.walk(ast, {
        IfStatement(node) { checkCond(node.test); },
        WhileStatement(node) { checkCond(node.test); },
    });
    return results;
}

function ruleEvalUsage(ast, lines, getLine) {
    const results = [];
    walker.walk(ast, {
        CallExpression(node) {
            if (node.callee?.name === 'eval') {
                results.push(makeResult('no-eval', 'error', `Avoid 'eval()' — it executes arbitrary code and is a security risk.`, node, getLine(node.line)));
            }
            if (node.callee?.name === 'setTimeout' || node.callee?.name === 'setInterval') {
                if (node.arguments[0]?.type === 'Literal' && typeof node.arguments[0].value === 'string') {
                    results.push(makeResult('no-implied-eval', 'error', `Passing a string to ${node.callee.name}() is implied eval.`, node, getLine(node.line)));
                }
            }
        },
    });
    return results;
}

function rulePromiseMissingCatch(ast, lines, getLine) {
    const results = [];
    walker.walk(ast, {
        CallExpression(node) {
            const c = node.callee;
            if (c?.type === 'MemberExpression' && c.property?.name === 'then') {
                let parent = c.object;
                let hasCatch = false;
                while (parent?.type === 'CallExpression') {
                    if (parent.callee?.property?.name === 'catch') { hasCatch = true; break; }
                    parent = parent.callee?.object;
                }
                if (!hasCatch) {
                    results.push(makeResult('promise-catch', 'warning', `Promise chain is missing a '.catch()' error handler.`, node, getLine(node.line)));
                }
            }
        },
    });
    return results;
}

function ruleAsyncWithoutTryCatch(ast, lines, getLine) {
    const results = [];
    const checkAsync = (node) => {
        if (!node.async) return;
        let hasTry = false;
        walker.walk(node.body, { TryStatement() { hasTry = true; } });
        if (!hasTry) {
            results.push(makeResult('require-await-try', 'warning', `Async function '${node.id?.name || '(anonymous)'}' has no try-catch block.`, node, getLine(node.line)));
        }
    };
    walker.walk(ast, { FunctionDeclaration: checkAsync, FunctionExpression: checkAsync, ArrowFunctionExpression: checkAsync });
    return results;
}

function ruleDuplicateObjectKeys(ast, lines, getLine) {
    const results = [];
    walker.walk(ast, {
        ObjectExpression(node) {
            const seen = new Set();
            for (const prop of (node.properties || [])) {
                const key = prop.key?.name || prop.key?.value;
                if (key && seen.has(key)) {
                    results.push(makeResult('no-dupe-keys', 'error', `Duplicate object key '${key}'.`, prop.key, getLine(prop.key?.line)));
                }
                if (key) seen.add(key);
            }
        },
    });
    return results;
}

function ruleLooseEquality(ast, lines, getLine) {
    const results = [];
    walker.walk(ast, {
        BinaryExpression(node) {
            if (node.operator === '==' || node.operator === '!=') {
                results.push(makeResult('eqeqeq', 'warning', `Use '${node.operator === '==' ? '===' : '!=='}' instead of '${node.operator}'.`, node, getLine(node.line)));
            }
        },
    });
    return results;
}

function ruleUnreachableCode(ast, lines, getLine) {
    const results = [];
    const checkBlock = (body) => {
        if (!Array.isArray(body)) return;
        for (let i = 0; i < body.length - 1; i++) {
            const stmt = body[i];
            if (stmt?.type === 'ReturnStatement' || stmt?.type === 'ThrowStatement' || stmt?.type === 'BreakStatement' || stmt?.type === 'ContinueStatement') {
                results.push(makeResult('no-unreachable', 'error', `Unreachable code after '${stmt.type.replace('Statement', '').toLowerCase()}'.`, body[i + 1], getLine(body[i + 1]?.line)));
                break;
            }
        }
    };
    walker.walk(ast, {
        BlockStatement(node) { checkBlock(node.body); },
        Program(node) { checkBlock(node.body); },
    });
    return results;
}

function ruleMissingStrictMode(ast, lines, getLine) {
    const results = [];
    if (ast.type !== 'Program') return results;
    const firstStmt = ast.body[0];
    const hasStrict = firstStmt?.type === 'ExpressionStatement' &&
        firstStmt.expression?.type === 'Literal' &&
        firstStmt.expression?.value === 'use strict';
    const hasModuleImport = ast.body.some(s => s?.type === 'ImportDeclaration' || s?.type === 'ExportNamedDeclaration' || s?.type === 'ExportDefaultDeclaration');
    if (!hasStrict && !hasModuleImport) {
        results.push(makeResult('strict', 'info', `Consider adding 'use strict' at the top of non-module scripts.`, ast.body[0] || { line: 1, col: 1 }, ''));
    }
    return results;
}