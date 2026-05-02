export class Router {
    #routes = new Map();
    #current = null;
    #bus;

    constructor(bus) {
        this.#bus = bus;
        window.addEventListener('hashchange', () => this.#resolve());
        window.addEventListener('popstate', () => this.#resolve());
    }

    register(path, handler) {
        this.#routes.set(path, handler);
        return this;
    }

    navigate(path) {
        window.location.hash = path;
    }

    start() {
        this.#resolve();
    }

    getCurrent() {
        return this.#current;
    }

    #resolve() {
        const hash = window.location.hash.replace('#', '') || '/';
        const [path, queryString] = hash.split('?');
        const params = Object.fromEntries(new URLSearchParams(queryString || ''));

        if (this.#routes.has(path)) {
            this.#current = path;
            this.#routes.get(path)(params);
            this.#bus.emit('router:navigate', { path, params });
            return;
        }

        for (const [pattern, handler] of this.#routes) {
            const match = this.#match(pattern, path);
            if (match) {
                this.#current = path;
                handler({ ...match, ...params });
                this.#bus.emit('router:navigate', { path, params: { ...match, ...params } });
                return;
            }
        }

        const fallback = this.#routes.get('*');
        if (fallback) fallback({ path, params });
    }

    #match(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        if (patternParts.length !== pathParts.length) return null;
        const result = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                result[patternParts[i].slice(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return result;
    }
}