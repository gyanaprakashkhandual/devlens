export class StateStore {
    #state = {};
    #subscribers = new Map();

    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.#state);
    }

    set(path, value) {
        const keys = path.split('.');
        let obj = this.#state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (obj[keys[i]] === undefined || typeof obj[keys[i]] !== 'object') {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        this.#notify(path);
    }

    subscribe(path, callback) {
        if (!this.#subscribers.has(path)) this.#subscribers.set(path, []);
        this.#subscribers.get(path).push(callback);
        return () => {
            const list = this.#subscribers.get(path);
            if (!list) return;
            const idx = list.indexOf(callback);
            if (idx !== -1) list.splice(idx, 1);
        };
    }

    #notify(changedPath) {
        for (const [path, callbacks] of this.#subscribers) {
            if (changedPath.startsWith(path) || path.startsWith(changedPath)) {
                const value = this.get(path);
                for (const cb of [...callbacks]) cb(value);
            }
        }
    }
}