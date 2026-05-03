export class ProxyInstrumentation {
    #log = [];
    #listenerMap = new Map();
    #intervalIds = new Set();

    wrapGlobals(sandboxWindow) {
        const self = this;
        const origAdd = sandboxWindow.EventTarget.prototype.addEventListener;
        const origRemove = sandboxWindow.EventTarget.prototype.removeEventListener;
        const origSetInterval = sandboxWindow.setInterval;
        const origClearInterval = sandboxWindow.clearInterval;
        const origSetTimeout = sandboxWindow.setTimeout;

        sandboxWindow.EventTarget.prototype.addEventListener = function(type, listener, options) {
            const key = type;
            self.#log.push({ type: 'addEventListener', event: key, timestamp: Date.now() });
            const count = (self.#listenerMap.get(key) || 0) + 1;
            self.#listenerMap.set(key, count);
            return origAdd.call(this, type, listener, options);
        };

        sandboxWindow.EventTarget.prototype.removeEventListener = function(type, listener, options) {
            const key = type;
            self.#log.push({ type: 'removeEventListener', event: key, timestamp: Date.now() });
            const count = Math.max(0, (self.#listenerMap.get(key) || 0) - 1);
            self.#listenerMap.set(key, count);
            return origRemove.call(this, type, listener, options);
        };

        sandboxWindow.setInterval = function(fn, delay, ...args) {
            const id = origSetInterval.call(sandboxWindow, fn, delay, ...args);
            self.#intervalIds.add(id);
            self.#log.push({ type: 'setInterval', id, delay, timestamp: Date.now() });
            return id;
        };

        sandboxWindow.clearInterval = function(id) {
            self.#intervalIds.delete(id);
            self.#log.push({ type: 'clearInterval', id, timestamp: Date.now() });
            return origClearInterval.call(sandboxWindow, id);
        };

        sandboxWindow.setTimeout = function(fn, delay, ...args) {
            if (typeof fn === 'string') {
                self.#log.push({ type: 'impliedEval', via: 'setTimeout', timestamp: Date.now() });
            }
            return origSetTimeout.call(sandboxWindow, fn, delay, ...args);
        };
    }

    getReport() {
        const listenerIssues = [];
        for (const [event, count] of this.#listenerMap) {
            if (count > 0) {
                listenerIssues.push({ event, unbalancedCount: count });
            }
        }
        return {
            log: [...this.#log],
            unbalancedListeners: listenerIssues,
            activeIntervals: this.#intervalIds.size,
            totalEvents: this.#log.length,
        };
    }

    clear() {
        this.#log = [];
        this.#listenerMap.clear();
        this.#intervalIds.clear();
    }
}