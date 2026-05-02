import { Parser } from './Parser.js';
import { runRules } from './Rules.js';
import { ScopeAnalyzer } from './ScopeAnalyzer.js';

self.onmessage = (e) => {
    const { id, source, config } = e.data;
    try {
        const parser = new Parser(source);
        const ast = parser.parse();
        const sourceLines = source.split('\n');
        const findings = runRules(ast, sourceLines, config);
        const scopeTree = new ScopeAnalyzer().analyze(ast);
        self.postMessage({ id, ast, findings, scopeTree, parseErrors: ast.errors || [] });
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};