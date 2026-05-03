export class ThemeController {
    #current = 'dark';
    #store;
    #listeners = [];

    constructor(store) {
        this.#store = store;
    }

    async init() {
        const saved = await this.#store.get('theme');
        const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        this.#current = saved || preferred;
        this.#apply();

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.#store) return;
            this.set(e.matches ? 'dark' : 'light');
        });
    }

    get() { return this.#current; }

    set(theme) {
        this.#current = theme;
        this.#apply();
        this.#store?.put('theme', theme);
        for (const fn of this.#listeners) fn(theme);
    }

    toggle() { this.set(this.#current === 'dark' ? 'light' : 'dark'); }

    onChange(fn) {
        this.#listeners.push(fn);
        return () => { const i = this.#listeners.indexOf(fn); if (i !== -1) this.#listeners.splice(i, 1); };
    }

    #apply() {
        document.documentElement.setAttribute('data-theme', this.#current);
        document.documentElement.classList.toggle('theme-dark', this.#current === 'dark');
        document.documentElement.classList.toggle('theme-light', this.#current === 'light');
    }
}