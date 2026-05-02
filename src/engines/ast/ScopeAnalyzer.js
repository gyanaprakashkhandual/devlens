import { ASTWalker } from './ASTWalker.js';

export class ScopeAnalyzer {
    #walker = new ASTWalker();

    analyze(ast) {
        const root = { type: 'global', name: 'Global', variables: [], children: [], closures: [] };
        const stack = [root];

        const current = () => stack[stack.length - 1];
        const pushScope = (type, name, node) => {
            const scope = { type, name, variables: [], children: [], closures: [], line: node?.line, col: node?.col };
            current().children.push(scope);
            stack.push(scope);
            return scope;
        };
        const popScope = () => stack.pop();
        const declare = (name, kind, node) => {
            current().variables.push({ name, kind, line: node?.line, col: node?.col, references: [] });
        };

        this.#walker.walk(ast, {
            FunctionDeclaration: (node) => {
                if (node.id) declare(node.id.name, 'function', node.id);
                pushScope('function', node.id?.name || '(anonymous)', node);
                for (const p of (node.params || [])) {
                    if (p.type === 'Identifier') declare(p.name, 'param', p);
                }
            },
            FunctionExpression: (node) => {
                pushScope('function', node.id?.name || '(anonymous)', node);
                for (const p of (node.params || [])) {
                    if (p.type === 'Identifier') declare(p.name, 'param', p);
                }
            },
            ArrowFunctionExpression: (node) => {
                pushScope('function', '(arrow)', node);
                for (const p of (node.params || [])) {
                    if (p.type === 'Identifier') declare(p.name, 'param', p);
                }
            },
            BlockStatement: (node) => {
                pushScope('block', '(block)', node);
            },
            VariableDeclaration: (node) => {
                for (const decl of (node.declarations || [])) {
                    if (decl.id?.type === 'Identifier') declare(decl.id.name, node.kind, decl.id);
                }
            },
            CatchClause: (node) => {
                pushScope('catch', '(catch)', node);
                if (node.param) declare(node.param.name, 'catch', node.param);
            },
            ClassDeclaration: (node) => {
                if (node.id) declare(node.id.name, 'class', node.id);
                pushScope('class', node.id?.name || '(class)', node);
            },
        });

        return root;
    }
}