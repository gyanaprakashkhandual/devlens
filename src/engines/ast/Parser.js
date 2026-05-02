import { Tokenizer } from './Tokenizer.js';

export class Parser {
    #tokens = [];
    #pos = 0;
    #errors = [];

    constructor(source) {
        const tokenizer = new Tokenizer(source);
        this.#tokens = tokenizer.tokenize().filter(t => t.type !== 'comment');
    }

    parse() {
        const body = [];
        while (!this.#isEOF()) {
            try {
                const stmt = this.#parseStatement();
                if (stmt) body.push(stmt);
            } catch (e) {
                this.#errors.push({ message: e.message, line: this.#peek()?.line || 0 });
                this.#recover();
            }
        }
        return { type: 'Program', body, errors: this.#errors, line: 1, col: 1 };
    }

    #peek(offset = 0) { return this.#tokens[this.#pos + offset] || { type: 'eof', value: '', line: 0, col: 0 }; }
    #isEOF() { return this.#peek().type === 'eof'; }
    #advance() { const t = this.#tokens[this.#pos]; if (this.#pos < this.#tokens.length) this.#pos++; return t; }

    #eat(typeOrValue) {
        const t = this.#peek();
        if (t.type === typeOrValue || t.value === typeOrValue) return this.#advance();
        return null;
    }

    #expect(value) {
        const t = this.#peek();
        if (t.value === value || t.type === value) return this.#advance();
        throw new Error(`Expected '${value}' at line ${t.line}, got '${t.value}'`);
    }

    #recover() {
        const sync = new Set(['function', 'class', 'if', 'for', 'while', 'return', 'const', 'let', 'var', 'export', 'import', '}', ';']);
        while (!this.#isEOF()) {
            const t = this.#peek();
            if (t.value === ';') { this.#advance(); return; }
            if (sync.has(t.value) || sync.has(t.type)) return;
            this.#advance();
        }
    }

    #parseStatement() {
        const t = this.#peek();
        if (t.type === 'eof') return null;
        if (t.value === ';') { this.#advance(); return { type: 'EmptyStatement', line: t.line, col: t.col }; }
        if (t.value === '{') return this.#parseBlockStatement();
        if (t.value === 'import') return this.#parseImport();
        if (t.value === 'export') return this.#parseExport();
        if (t.value === 'function') return this.#parseFunctionDeclaration();
        if (t.value === 'class') return this.#parseClassDeclaration();
        if (t.value === 'const' || t.value === 'let' || t.value === 'var') return this.#parseVariableDeclaration();
        if (t.value === 'return') return this.#parseReturn();
        if (t.value === 'throw') return this.#parseThrow();
        if (t.value === 'if') return this.#parseIf();
        if (t.value === 'for') return this.#parseFor();
        if (t.value === 'while') return this.#parseWhile();
        if (t.value === 'do') return this.#parseDoWhile();
        if (t.value === 'try') return this.#parseTry();
        if (t.value === 'switch') return this.#parseSwitch();
        if (t.value === 'break') return this.#parseBreak();
        if (t.value === 'continue') return this.#parseContinue();
        if (t.value === 'debugger') { this.#advance(); this.#eat(';'); return { type: 'DebuggerStatement', line: t.line, col: t.col }; }
        return this.#parseExpressionStatement();
    }

    #parseBlockStatement() {
        const t = this.#expect('{');
        const body = [];
        while (this.#peek().value !== '}' && !this.#isEOF()) {
            try { const s = this.#parseStatement(); if (s) body.push(s); }
            catch (e) { this.#errors.push({ message: e.message, line: this.#peek()?.line || 0 }); this.#recover(); }
        }
        this.#expect('}');
        return { type: 'BlockStatement', body, line: t.line, col: t.col };
    }

    #parseFunctionDeclaration(isExpr = false) {
        const t = this.#expect('function');
        const isAsync = false;
        let generator = false;
        if (this.#peek().value === '*') { this.#advance(); generator = true; }
        let id = null;
        if (this.#peek().type === 'identifier') id = { type: 'Identifier', name: this.#advance().value, line: this.#peek().line, col: this.#peek().col };
        const params = this.#parseParams();
        const body = this.#parseBlockStatement();
        return { type: isExpr ? 'FunctionExpression' : 'FunctionDeclaration', id, params, body, generator, async: isAsync, line: t.line, col: t.col };
    }

    #parseParams() {
        this.#expect('(');
        const params = [];
        while (this.#peek().value !== ')' && !this.#isEOF()) {
            if (this.#peek().value === '...') {
                this.#advance();
                const arg = this.#peek();
                this.#advance();
                params.push({ type: 'RestElement', argument: { type: 'Identifier', name: arg.value, line: arg.line, col: arg.col }, line: arg.line, col: arg.col });
            } else if (this.#peek().value === '{' || this.#peek().value === '[') {
                params.push(this.#parseExpression());
            } else {
                const p = this.#advance();
                if (this.#peek().value === '=') {
                    this.#advance();
                    const def = this.#parseAssignment();
                    params.push({ type: 'AssignmentPattern', left: { type: 'Identifier', name: p.value, line: p.line, col: p.col }, right: def, line: p.line, col: p.col });
                } else {
                    params.push({ type: 'Identifier', name: p.value, line: p.line, col: p.col });
                }
            }
            if (this.#peek().value === ',') this.#advance();
        }
        this.#expect(')');
        return params;
    }

    #parseClassDeclaration(isExpr = false) {
        const t = this.#expect('class');
        let id = null;
        if (this.#peek().type === 'identifier') id = { type: 'Identifier', name: this.#advance().value, line: t.line, col: t.col };
        let superClass = null;
        if (this.#peek().value === 'extends') { this.#advance(); superClass = this.#parseLeftHandSide(); }
        this.#expect('{');
        const body = [];
        while (this.#peek().value !== '}' && !this.#isEOF()) {
            try { body.push(this.#parseClassMember()); }
            catch (e) { this.#errors.push({ message: e.message }); this.#recover(); }
        }
        this.#expect('}');
        return { type: isExpr ? 'ClassExpression' : 'ClassDeclaration', id, superClass, body: { type: 'ClassBody', body }, line: t.line, col: t.col };
    }

    #parseClassMember() {
        let isStatic = false;
        if (this.#peek().value === 'static') { this.#advance(); isStatic = true; }
        let kind = 'method';
        if (this.#peek().value === 'get' || this.#peek().value === 'set') {
            const kw = this.#peek().value;
            if (this.#peek(1).type === 'identifier' || this.#peek(1).value === '[') { kind = kw; this.#advance(); }
        }
        const t = this.#peek();
        let key;
        if (t.value === '[') { this.#advance(); key = this.#parseAssignment(); this.#expect(']'); }
        else { key = { type: 'Identifier', name: this.#advance().value, line: t.line, col: t.col }; }
        if (this.#peek().value === '(') {
            const params = this.#parseParams();
            const body = this.#parseBlockStatement();
            return { type: 'MethodDefinition', key, kind, static: isStatic, value: { type: 'FunctionExpression', params, body, line: t.line, col: t.col }, line: t.line, col: t.col };
        }
        if (this.#peek().value === '=') { this.#advance(); const val = this.#parseAssignment(); this.#eat(';'); return { type: 'PropertyDefinition', key, value: val, static: isStatic, line: t.line, col: t.col }; }
        this.#eat(';');
        return { type: 'PropertyDefinition', key, value: null, static: isStatic, line: t.line, col: t.col };
    }

    #parseVariableDeclaration() {
        const t = this.#advance();
        const kind = t.value;
        const declarations = [];
        do {
            const id = this.#parseBindingPattern();
            let init = null;
            if (this.#peek().value === '=') { this.#advance(); init = this.#parseAssignment(); }
            declarations.push({ type: 'VariableDeclarator', id, init, line: id.line, col: id.col });
        } while (this.#eat(','));
        this.#eat(';');
        return { type: 'VariableDeclaration', kind, declarations, line: t.line, col: t.col };
    }

    #parseBindingPattern() {
        const t = this.#peek();
        if (t.value === '{') return this.#parseObjectPattern();
        if (t.value === '[') return this.#parseArrayPattern();
        this.#advance();
        return { type: 'Identifier', name: t.value, line: t.line, col: t.col };
    }

    #parseObjectPattern() {
        const t = this.#expect('{');
        const props = [];
        while (this.#peek().value !== '}' && !this.#isEOF()) {
            if (this.#peek().value === '...') {
                this.#advance();
                const arg = this.#parseBindingPattern();
                props.push({ type: 'RestElement', argument: arg, line: arg.line, col: arg.col });
            } else {
                const key = this.#advance();
                const keyNode = { type: 'Identifier', name: key.value, line: key.line, col: key.col };
                if (this.#peek().value === ':') {
                    this.#advance();
                    const val = this.#parseBindingPattern();
                    props.push({ type: 'Property', key: keyNode, value: val, shorthand: false, line: key.line, col: key.col });
                } else if (this.#peek().value === '=') {
                    this.#advance();
                    const def = this.#parseAssignment();
                    props.push({ type: 'Property', key: keyNode, value: { type: 'AssignmentPattern', left: keyNode, right: def, line: key.line, col: key.col }, shorthand: true, line: key.line, col: key.col });
                } else {
                    props.push({ type: 'Property', key: keyNode, value: keyNode, shorthand: true, line: key.line, col: key.col });
                }
            }
            if (this.#peek().value === ',') this.#advance();
        }
        this.#expect('}');
        return { type: 'ObjectPattern', properties: props, line: t.line, col: t.col };
    }

    #parseArrayPattern() {
        const t = this.#expect('[');
        const elements = [];
        while (this.#peek().value !== ']' && !this.#isEOF()) {
            if (this.#peek().value === ',') { elements.push(null); this.#advance(); continue; }
            if (this.#peek().value === '...') { this.#advance(); elements.push({ type: 'RestElement', argument: this.#parseBindingPattern(), line: this.#peek().line, col: this.#peek().col }); }
            else elements.push(this.#parseBindingPattern());
            if (this.#peek().value === ',') this.#advance();
        }
        this.#expect(']');
        return { type: 'ArrayPattern', elements, line: t.line, col: t.col };
    }

    #parseReturn() {
        const t = this.#expect('return');
        let arg = null;
        if (this.#peek().value !== ';' && this.#peek().value !== '}' && !this.#isEOF()) arg = this.#parseExpression();
        this.#eat(';');
        return { type: 'ReturnStatement', argument: arg, line: t.line, col: t.col };
    }

    #parseThrow() {
        const t = this.#expect('throw');
        const arg = this.#parseExpression();
        this.#eat(';');
        return { type: 'ThrowStatement', argument: arg, line: t.line, col: t.col };
    }

    #parseIf() {
        const t = this.#expect('if');
        this.#expect('(');
        const test = this.#parseExpression();
        this.#expect(')');
        const consequent = this.#parseStatement();
        let alternate = null;
        if (this.#peek().value === 'else') { this.#advance(); alternate = this.#parseStatement(); }
        return { type: 'IfStatement', test, consequent, alternate, line: t.line, col: t.col };
    }

    #parseFor() {
        const t = this.#expect('for');
        const isAwait = this.#peek().value === 'await' ? !!this.#advance() : false;
        this.#expect('(');
        if (this.#peek().value === ';') {
            this.#advance();
            const test = this.#peek().value !== ';' ? this.#parseExpression() : null;
            this.#expect(';');
            const update = this.#peek().value !== ')' ? this.#parseExpression() : null;
            this.#expect(')');
            return { type: 'ForStatement', init: null, test, update, body: this.#parseStatement(), line: t.line, col: t.col };
        }
        let init;
        if (this.#peek().value === 'const' || this.#peek().value === 'let' || this.#peek().value === 'var') {
            const kind = this.#advance().value;
            const id = this.#parseBindingPattern();
            if (this.#peek().value === 'of') {
                this.#advance();
                const right = this.#parseAssignment();
                this.#expect(')');
                return { type: 'ForOfStatement', left: { type: 'VariableDeclaration', kind, declarations: [{ type: 'VariableDeclarator', id, init: null, line: id.line, col: id.col }], line: id.line, col: id.col }, right, body: this.#parseStatement(), await: isAwait, line: t.line, col: t.col };
            }
            if (this.#peek().value === 'in') {
                this.#advance();
                const right = this.#parseExpression();
                this.#expect(')');
                return { type: 'ForInStatement', left: { type: 'VariableDeclaration', kind, declarations: [{ type: 'VariableDeclarator', id, init: null, line: id.line, col: id.col }], line: id.line, col: id.col }, right, body: this.#parseStatement(), line: t.line, col: t.col };
            }
            let initVal = null;
            if (this.#peek().value === '=') { this.#advance(); initVal = this.#parseAssignment(); }
            init = { type: 'VariableDeclaration', kind, declarations: [{ type: 'VariableDeclarator', id, init: initVal, line: id.line, col: id.col }], line: id.line, col: id.col };
        } else {
            init = this.#parseExpression();
        }
        if (this.#peek().value === 'of') { this.#advance(); const r = this.#parseAssignment(); this.#expect(')'); return { type: 'ForOfStatement', left: init, right: r, body: this.#parseStatement(), await: isAwait, line: t.line, col: t.col }; }
        if (this.#peek().value === 'in') { this.#advance(); const r = this.#parseExpression(); this.#expect(')'); return { type: 'ForInStatement', left: init, right: r, body: this.#parseStatement(), line: t.line, col: t.col }; }
        this.#expect(';');
        const test = this.#peek().value !== ';' ? this.#parseExpression() : null;
        this.#expect(';');
        const update = this.#peek().value !== ')' ? this.#parseExpression() : null;
        this.#expect(')');
        return { type: 'ForStatement', init, test, update, body: this.#parseStatement(), line: t.line, col: t.col };
    }

    #parseWhile() {
        const t = this.#expect('while');
        this.#expect('(');
        const test = this.#parseExpression();
        this.#expect(')');
        return { type: 'WhileStatement', test, body: this.#parseStatement(), line: t.line, col: t.col };
    }

    #parseDoWhile() {
        const t = this.#expect('do');
        const body = this.#parseStatement();
        this.#expect('while');
        this.#expect('(');
        const test = this.#parseExpression();
        this.#expect(')');
        this.#eat(';');
        return { type: 'DoWhileStatement', body, test, line: t.line, col: t.col };
    }

    #parseTry() {
        const t = this.#expect('try');
        const block = this.#parseBlockStatement();
        let handler = null;
        let finalizer = null;
        if (this.#peek().value === 'catch') {
            const ct = this.#advance();
            let param = null;
            if (this.#peek().value === '(') { this.#advance(); param = this.#parseBindingPattern(); this.#expect(')'); }
            const body = this.#parseBlockStatement();
            handler = { type: 'CatchClause', param, body, line: ct.line, col: ct.col };
        }
        if (this.#peek().value === 'finally') { this.#advance(); finalizer = this.#parseBlockStatement(); }
        return { type: 'TryStatement', block, handler, finalizer, line: t.line, col: t.col };
    }

    #parseSwitch() {
        const t = this.#expect('switch');
        this.#expect('(');
        const discriminant = this.#parseExpression();
        this.#expect(')');
        this.#expect('{');
        const cases = [];
        while (this.#peek().value !== '}' && !this.#isEOF()) {
            const ct = this.#peek();
            let test = null;
            if (ct.value === 'case') { this.#advance(); test = this.#parseExpression(); this.#expect(':'); }
            else if (ct.value === 'default') { this.#advance(); this.#expect(':'); }
            else break;
            const consequent = [];
            while (this.#peek().value !== 'case' && this.#peek().value !== 'default' && this.#peek().value !== '}' && !this.#isEOF()) {
                const s = this.#parseStatement(); if (s) consequent.push(s);
            }
            cases.push({ type: 'SwitchCase', test, consequent, line: ct.line, col: ct.col });
        }
        this.#expect('}');
        return { type: 'SwitchStatement', discriminant, cases, line: t.line, col: t.col };
    }

    #parseBreak() {
        const t = this.#expect('break');
        let label = null;
        if (this.#peek().type === 'identifier') label = { type: 'Identifier', name: this.#advance().value, line: t.line, col: t.col };
        this.#eat(';');
        return { type: 'BreakStatement', label, line: t.line, col: t.col };
    }

    #parseContinue() {
        const t = this.#expect('continue');
        let label = null;
        if (this.#peek().type === 'identifier') label = { type: 'Identifier', name: this.#advance().value, line: t.line, col: t.col };
        this.#eat(';');
        return { type: 'ContinueStatement', label, line: t.line, col: t.col };
    }

    #parseImport() {
        const t = this.#expect('import');
        if (this.#peek().value === '(') {
            this.#advance();
            const source = this.#parseAssignment();
            this.#expect(')');
            return { type: 'ImportExpression', source, line: t.line, col: t.col };
        }
        if (this.#peek().type === 'string') {
            const src = this.#advance();
            this.#eat(';');
            return { type: 'ImportDeclaration', specifiers: [], source: { type: 'Literal', value: src.value, line: src.line, col: src.col }, line: t.line, col: t.col };
        }
        const specifiers = [];
        if (this.#peek().value === '*') {
            this.#advance(); this.#expect('as');
            const local = this.#advance();
            specifiers.push({ type: 'ImportNamespaceSpecifier', local: { type: 'Identifier', name: local.value, line: local.line, col: local.col }, line: local.line, col: local.col });
        } else if (this.#peek().type === 'identifier') {
            const local = this.#advance();
            specifiers.push({ type: 'ImportDefaultSpecifier', local: { type: 'Identifier', name: local.value, line: local.line, col: local.col }, line: local.line, col: local.col });
            if (this.#peek().value === ',') this.#advance();
        }
        if (this.#peek().value === '{') {
            this.#advance();
            while (this.#peek().value !== '}' && !this.#isEOF()) {
                const imported = this.#advance();
                let local = imported;
                if (this.#peek().value === 'as') { this.#advance(); local = this.#advance(); }
                specifiers.push({ type: 'ImportSpecifier', imported: { type: 'Identifier', name: imported.value, line: imported.line, col: imported.col }, local: { type: 'Identifier', name: local.value, line: local.line, col: local.col }, line: imported.line, col: imported.col });
                if (this.#peek().value === ',') this.#advance();
            }
            this.#expect('}');
        }
        this.#expect('from');
        const src = this.#advance();
        this.#eat(';');
        return { type: 'ImportDeclaration', specifiers, source: { type: 'Literal', value: src.value, line: src.line, col: src.col }, line: t.line, col: t.col };
    }

    #parseExport() {
        const t = this.#expect('export');
        if (this.#peek().value === 'default') {
            this.#advance();
            const decl = this.#peek().value === 'function' ? this.#parseFunctionDeclaration(false) : this.#peek().value === 'class' ? this.#parseClassDeclaration(true) : this.#parseAssignment();
            this.#eat(';');
            return { type: 'ExportDefaultDeclaration', declaration: decl, line: t.line, col: t.col };
        }
        if (this.#peek().value === '*') {
            this.#advance();
            let exported = null;
            if (this.#peek().value === 'as') { this.#advance(); exported = { type: 'Identifier', name: this.#advance().value }; }
            this.#expect('from');
            const src = this.#advance();
            this.#eat(';');
            return { type: 'ExportAllDeclaration', exported, source: { type: 'Literal', value: src.value }, line: t.line, col: t.col };
        }
        if (this.#peek().value === '{') {
            this.#advance();
            const specifiers = [];
            while (this.#peek().value !== '}' && !this.#isEOF()) {
                const local = this.#advance();
                let exported = local;
                if (this.#peek().value === 'as') { this.#advance(); exported = this.#advance(); }
                specifiers.push({ type: 'ExportSpecifier', local: { type: 'Identifier', name: local.value }, exported: { type: 'Identifier', name: exported.value }, line: local.line, col: local.col });
                if (this.#peek().value === ',') this.#advance();
            }
            this.#expect('}');
            let source = null;
            if (this.#peek().value === 'from') { this.#advance(); source = { type: 'Literal', value: this.#advance().value }; }
            this.#eat(';');
            return { type: 'ExportNamedDeclaration', specifiers, source, declaration: null, line: t.line, col: t.col };
        }
        let decl = null;
        if (this.#peek().value === 'function') decl = this.#parseFunctionDeclaration();
        else if (this.#peek().value === 'class') decl = this.#parseClassDeclaration();
        else if (this.#peek().value === 'const' || this.#peek().value === 'let' || this.#peek().value === 'var') decl = this.#parseVariableDeclaration();
        return { type: 'ExportNamedDeclaration', specifiers: [], source: null, declaration: decl, line: t.line, col: t.col };
    }

    #parseExpressionStatement() {
        const expr = this.#parseExpression();
        if (!expr) return null;
        this.#eat(';');
        if (expr.type === 'Literal' && typeof expr.value === 'string') return { type: 'ExpressionStatement', expression: expr, line: expr.line, col: expr.col };
        return { type: 'ExpressionStatement', expression: expr, line: expr.line, col: expr.col };
    }

    #parseExpression() {
        const expr = this.#parseAssignment();
        if (this.#peek().value === ',') {
            const exprs = [expr];
            while (this.#peek().value === ',') { this.#advance(); exprs.push(this.#parseAssignment()); }
            return { type: 'SequenceExpression', expressions: exprs, line: expr.line, col: expr.col };
        }
        return expr;
    }

    #parseAssignment() {
        const left = this.#parseConditional();
        const t = this.#peek();
        const assignOps = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&&=', '||=', '??=']);
        if (assignOps.has(t.value)) {
            this.#advance();
            const right = this.#parseAssignment();
            return { type: 'AssignmentExpression', operator: t.value, left, right, line: t.line, col: t.col };
        }
        if (t.value === '=>') {
            this.#advance();
            const body = this.#peek().value === '{' ? this.#parseBlockStatement() : this.#parseAssignment();
            const params = left.type === 'SequenceExpression' ? left.expressions : left.type === 'Identifier' ? [left] : left.expressions || [left];
            return { type: 'ArrowFunctionExpression', params, body, async: false, expression: body.type !== 'BlockStatement', line: t.line, col: t.col };
        }
        return left;
    }

    #parseConditional() {
        let expr = this.#parseNullCoalesce();
        if (this.#peek().value === '?') {
            this.#advance();
            const consequent = this.#parseAssignment();
            this.#expect(':');
            const alternate = this.#parseAssignment();
            return { type: 'ConditionalExpression', test: expr, consequent, alternate, line: expr.line, col: expr.col };
        }
        return expr;
    }

    #parseNullCoalesce() {
        let left = this.#parseOr();
        while (this.#peek().value === '??') {
            const t = this.#advance();
            left = { type: 'LogicalExpression', operator: '??', left, right: this.#parseOr(), line: t.line, col: t.col };
        }
        return left;
    }

    #parseOr() {
        let left = this.#parseAnd();
        while (this.#peek().value === '||') {
            const t = this.#advance();
            left = { type: 'LogicalExpression', operator: '||', left, right: this.#parseAnd(), line: t.line, col: t.col };
        }
        return left;
    }

    #parseAnd() {
        let left = this.#parseBitOr();
        while (this.#peek().value === '&&') {
            const t = this.#advance();
            left = { type: 'LogicalExpression', operator: '&&', left, right: this.#parseBitOr(), line: t.line, col: t.col };
        }
        return left;
    }

    #parseBitOr() {
        let left = this.#parseBitXor();
        while (this.#peek().value === '|') { const t = this.#advance(); left = { type: 'BinaryExpression', operator: '|', left, right: this.#parseBitXor(), line: t.line, col: t.col }; }
        return left;
    }

    #parseBitXor() {
        let left = this.#parseBitAnd();
        while (this.#peek().value === '^') { const t = this.#advance(); left = { type: 'BinaryExpression', operator: '^', left, right: this.#parseBitAnd(), line: t.line, col: t.col }; }
        return left;
    }

    #parseBitAnd() {
        let left = this.#parseEquality();
        while (this.#peek().value === '&') { const t = this.#advance(); left = { type: 'BinaryExpression', operator: '&', left, right: this.#parseEquality(), line: t.line, col: t.col }; }
        return left;
    }

    #parseEquality() {
        let left = this.#parseRelational();
        const eqOps = new Set(['==', '!=', '===', '!==']);
        while (eqOps.has(this.#peek().value)) { const t = this.#advance(); left = { type: 'BinaryExpression', operator: t.value, left, right: this.#parseRelational(), line: t.line, col: t.col }; }
        return left;
    }

    #parseRelational() {
        let left = this.#parseShift();
        const relOps = new Set(['<', '>', '<=', '>=', 'instanceof', 'in']);
        while (relOps.has(this.#peek().value)) { const t = this.#advance(); left = { type: 'BinaryExpression', operator: t.value, left, right: this.#parseShift(), line: t.line, col: t.col }; }
        return left;
    }

    #parseShift() {
        let left = this.#parseAdditive();
        const shiftOps = new Set(['<<', '>>', '>>>']);
        while (shiftOps.has(this.#peek().value)) { const t = this.#advance(); left = { type: 'BinaryExpression', operator: t.value, left, right: this.#parseAdditive(), line: t.line, col: t.col }; }
        return left;
    }

    #parseAdditive() {
        let left = this.#parseMultiplicative();
        while (this.#peek().value === '+' || this.#peek().value === '-') { const t = this.#advance(); left = { type: 'BinaryExpression', operator: t.value, left, right: this.#parseMultiplicative(), line: t.line, col: t.col }; }
        return left;
    }

    #parseMultiplicative() {
        let left = this.#parseExponentiation();
        while (['*', '/', '%'].includes(this.#peek().value)) { const t = this.#advance(); left = { type: 'BinaryExpression', operator: t.value, left, right: this.#parseExponentiation(), line: t.line, col: t.col }; }
        return left;
    }

    #parseExponentiation() {
        const base = this.#parseUnary();
        if (this.#peek().value === '**') { const t = this.#advance(); return { type: 'BinaryExpression', operator: '**', left: base, right: this.#parseExponentiation(), line: t.line, col: t.col }; }
        return base;
    }

    #parseUnary() {
        const t = this.#peek();
        if (['!', '~', '+', '-', 'typeof', 'void', 'delete', 'await'].includes(t.value)) {
            this.#advance();
            return { type: t.value === 'await' ? 'AwaitExpression' : 'UnaryExpression', operator: t.value, argument: this.#parseUnary(), prefix: true, line: t.line, col: t.col };
        }
        if (t.value === '++' || t.value === '--') {
            this.#advance();
            return { type: 'UpdateExpression', operator: t.value, argument: this.#parseLeftHandSide(), prefix: true, line: t.line, col: t.col };
        }
        return this.#parsePostfix();
    }

    #parsePostfix() {
        const expr = this.#parseCallOrMember();
        const t = this.#peek();
        if ((t.value === '++' || t.value === '--')) { this.#advance(); return { type: 'UpdateExpression', operator: t.value, argument: expr, prefix: false, line: t.line, col: t.col }; }
        return expr;
    }

    #parseCallOrMember() {
        let expr = this.#parsePrimary();
        while (true) {
            const t = this.#peek();
            if (t.value === '.' || t.value === '?.') {
                this.#advance();
                const prop = this.#advance();
                expr = { type: 'MemberExpression', object: expr, property: { type: 'Identifier', name: prop.value, line: prop.line, col: prop.col }, computed: false, optional: t.value === '?.', line: t.line, col: t.col };
            } else if (t.value === '[') {
                this.#advance();
                const prop = this.#parseExpression();
                this.#expect(']');
                expr = { type: 'MemberExpression', object: expr, property: prop, computed: true, optional: false, line: t.line, col: t.col };
            } else if (t.value === '(') {
                const args = this.#parseArguments();
                expr = { type: 'CallExpression', callee: expr, arguments: args, line: t.line, col: t.col };
            } else if (t.value === '`') {
                const quasi = this.#parsePrimary();
                expr = { type: 'TaggedTemplateExpression', tag: expr, quasi, line: t.line, col: t.col };
            } else break;
        }
        return expr;
    }

    #parseLeftHandSide() { return this.#parseCallOrMember(); }

    #parseArguments() {
        this.#expect('(');
        const args = [];
        while (this.#peek().value !== ')' && !this.#isEOF()) {
            if (this.#peek().value === '...') { this.#advance(); args.push({ type: 'SpreadElement', argument: this.#parseAssignment(), line: this.#peek().line, col: this.#peek().col }); }
            else args.push(this.#parseAssignment());
            if (this.#peek().value === ',') this.#advance();
        }
        this.#expect(')');
        return args;
    }

    #parsePrimary() {
        const t = this.#peek();
        if (t.type === 'number') { this.#advance(); return { type: 'Literal', value: parseFloat(t.value), raw: t.value, line: t.line, col: t.col }; }
        if (t.type === 'string') { this.#advance(); const v = t.value.slice(1, -1); return { type: 'Literal', value: v, raw: t.value, line: t.line, col: t.col }; }
        if (t.type === 'boolean') { this.#advance(); return { type: 'Literal', value: t.value === 'true', raw: t.value, line: t.line, col: t.col }; }
        if (t.type === 'null') { this.#advance(); return { type: 'Literal', value: null, raw: 'null', line: t.line, col: t.col }; }
        if (t.type === 'regex') { this.#advance(); return { type: 'Literal', regex: { pattern: t.value, flags: '' }, raw: t.value, line: t.line, col: t.col }; }
        if (t.type === 'template') { this.#advance(); return { type: 'TemplateLiteral', quasis: [{ type: 'TemplateElement', value: { raw: t.value, cooked: t.value }, tail: true }], expressions: [], line: t.line, col: t.col }; }
        if (t.value === 'this') { this.#advance(); return { type: 'ThisExpression', line: t.line, col: t.col }; }
        if (t.value === 'super') { this.#advance(); return { type: 'Super', line: t.line, col: t.col }; }
        if (t.value === 'new') {
            this.#advance();
            if (this.#peek().value === 'target') { this.#advance(); return { type: 'MetaProperty', meta: { name: 'new' }, property: { name: 'target' }, line: t.line, col: t.col }; }
            const callee = this.#parseCallOrMember();
            const args = this.#peek().value === '(' ? this.#parseArguments() : [];
            return { type: 'NewExpression', callee, arguments: args, line: t.line, col: t.col };
        }
        if (t.value === 'function') return this.#parseFunctionDeclaration(true);
        if (t.value === 'class') return this.#parseClassDeclaration(true);
        if (t.value === 'async') {
            this.#advance();
            if (this.#peek().value === 'function') {
                const fn = this.#parseFunctionDeclaration(true);
                fn.async = true;
                return fn;
            }
            const expr = this.#parseAssignment();
            if (expr.type === 'ArrowFunctionExpression') { expr.async = true; return expr; }
            return expr;
        }
        if (t.value === 'yield') {
            this.#advance();
            let delegate = false;
            if (this.#peek().value === '*') { this.#advance(); delegate = true; }
            const arg = ![')', ']', '}', ',', ';'].includes(this.#peek().value) ? this.#parseAssignment() : null;
            return { type: 'YieldExpression', argument: arg, delegate, line: t.line, col: t.col };
        }
        if (t.value === '[') {
            this.#advance();
            const elements = [];
            while (this.#peek().value !== ']' && !this.#isEOF()) {
                if (this.#peek().value === ',') { elements.push(null); this.#advance(); continue; }
                if (this.#peek().value === '...') { this.#advance(); elements.push({ type: 'SpreadElement', argument: this.#parseAssignment(), line: t.line, col: t.col }); }
                else elements.push(this.#parseAssignment());
                if (this.#peek().value === ',') this.#advance();
            }
            this.#expect(']');
            return { type: 'ArrayExpression', elements, line: t.line, col: t.col };
        }
        if (t.value === '{') {
            this.#advance();
            const props = [];
            while (this.#peek().value !== '}' && !this.#isEOF()) {
                if (this.#peek().value === '...') {
                    this.#advance();
                    props.push({ type: 'SpreadElement', argument: this.#parseAssignment(), line: this.#peek().line, col: this.#peek().col });
                } else {
                    let computed = false, kind = 'init', isAsync = false, generator = false;
                    if (this.#peek().value === 'async') { isAsync = true; this.#advance(); }
                    if (this.#peek().value === '*') { generator = true; this.#advance(); }
                    if (this.#peek().value === 'get' || this.#peek().value === 'set') {
                        const kw = this.#peek().value;
                        if (this.#peek(1).type === 'identifier' || this.#peek(1).value === '[') { kind = kw; this.#advance(); }
                    }
                    let key;
                    if (this.#peek().value === '[') { this.#advance(); key = this.#parseAssignment(); this.#expect(']'); computed = true; }
                    else { const k = this.#advance(); key = { type: k.type === 'identifier' ? 'Identifier' : 'Literal', name: k.value, value: k.value, line: k.line, col: k.col }; }
                    if (this.#peek().value === '(' || kind !== 'init' || generator || isAsync) {
                        const params = this.#parseParams();
                        const body = this.#parseBlockStatement();
                        props.push({ type: 'Property', key, value: { type: 'FunctionExpression', params, body, async: isAsync, generator, line: key.line, col: key.col }, kind, computed, shorthand: false, line: key.line, col: key.col });
                    } else if (this.#peek().value === ':') {
                        this.#advance();
                        props.push({ type: 'Property', key, value: this.#parseAssignment(), kind: 'init', computed, shorthand: false, line: key.line, col: key.col });
                    } else {
                        props.push({ type: 'Property', key, value: key, kind: 'init', computed, shorthand: true, line: key.line, col: key.col });
                    }
                }
                if (this.#peek().value === ',') this.#advance();
            }
            this.#expect('}');
            return { type: 'ObjectExpression', properties: props, line: t.line, col: t.col };
        }
        if (t.value === '(') {
            this.#advance();
            if (this.#peek().value === ')') {
                this.#advance();
                this.#expect('=>');
                const body = this.#peek().value === '{' ? this.#parseBlockStatement() : this.#parseAssignment();
                return { type: 'ArrowFunctionExpression', params: [], body, async: false, expression: body.type !== 'BlockStatement', line: t.line, col: t.col };
            }
            const expr = this.#parseExpression();
            this.#expect(')');
            return expr;
        }
        if (t.value === 'import') {
            this.#advance();
            this.#expect('(');
            const source = this.#parseAssignment();
            this.#expect(')');
            return { type: 'ImportExpression', source, line: t.line, col: t.col };
        }
        if (t.type === 'identifier') {
            this.#advance();
            return { type: 'Identifier', name: t.value, line: t.line, col: t.col };
        }
        this.#advance();
        return { type: 'Literal', value: t.value, raw: t.value, line: t.line, col: t.col };
    }
}