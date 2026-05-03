export class OutputCollector {
    #entries = [];
    #maxEntries;
    #listeners = [];

    constructor(maxEntries = 500) {
        this.#maxEntries = maxEntries;
    }

    push(entry) {
        const normalized = {
            id: crypto.randomUUID(),
            method: entry.method || 'log',
            args: entry.args || [],
            timestamp: entry.timestamp ?? performance.now(),
            line: entry.line ?? null,
        };
        this.#entries.push(normalized);
        if (this.#entries.length > this.#maxEntries) this.#entries.shift();
        for (const fn of this.#listeners) fn(normalized);
    }

    onEntry(fn) {
        this.#listeners.push(fn);
        return () => { const i = this.#listeners.indexOf(fn); if (i !== -1) this.#listeners.splice(i, 1); };
    }

    getAll() { return [...this.#entries]; }

    clear() {
        this.#entries = [];
        for (const fn of this.#listeners) fn({ type: 'clear' });
    }

    filter(method) {
        return method === 'all' ? this.getAll() : this.#entries.filter(e => e.method === method);
    }

    toText() {
        return this.#entries.map(e => `[${e.method.toUpperCase()}] ${e.args.join(' ')}`).join('\n');
    }
}