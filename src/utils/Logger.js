const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, none: 4 };

export class Logger {
    #level;
    #prefix;
    #history = [];
    #maxHistory;

    constructor(prefix = 'DevLens', level = 'info', maxHistory = 200) {
        this.#prefix = prefix;
        this.#level = LEVELS[level] ?? LEVELS.info;
        this.#maxHistory = maxHistory;
    }

    setLevel(level) { this.#level = LEVELS[level] ?? this.#level; }

    debug(...args) { this.#log('debug', args); }
    info(...args)  { this.#log('info', args); }
    warn(...args)  { this.#log('warn', args); }
    error(...args) { this.#log('error', args); }

    getHistory(level) {
        if (!level || level === 'all') return [...this.#history];
        return this.#history.filter(e => e.level === level);
    }

    clear() { this.#history = []; }

    #log(level, args) {
        if (LEVELS[level] < this.#level) return;
        const entry = { level, message: args.map(String).join(' '), timestamp: Date.now() };
        this.#history.push(entry);
        if (this.#history.length > this.#maxHistory) this.#history.shift();
        const fn = console[level] || console.log;
        fn(`[${this.#prefix}] [${level.toUpperCase()}]`, ...args);
    }
}

export const logger = new Logger('DevLens', 'info');