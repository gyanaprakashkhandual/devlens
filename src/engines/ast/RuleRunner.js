export class RuleRunner {
    #rules = new Map();
    #config = {};

    constructor(config = {}) {
        this.#config = config;
    }

    register(id, fn) {
        this.#rules.set(id, fn);
        return this;
    }

    run(ast, sourceLines) {
        const results = [];
        for (const [id, fn] of this.#rules) {
            try {
                const findings = fn(ast, sourceLines, this.#config);
                if (Array.isArray(findings)) results.push(...findings);
            } catch { }
        }
        return results.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
    }

    setConfig(config) {
        this.#config = { ...this.#config, ...config };
    }
}