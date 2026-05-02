import { FileStore, ResultStore, SettingsStore, HistoryStore } from '../storage/session.store.js';

export class SessionManager {
    #bus;
    #state;

    constructor(bus, state) {
        this.#bus = bus;
        this.#state = state;
    }

    async init() {
        try {
            const files = await FileStore.getAll();
            const settings = await SettingsStore.getAll();
            if (files.length > 0) {
                this.#state.set('session.files', Object.fromEntries(files.map(f => [f.name, f])));
                this.#bus.emit('session:restored', { files, settings });
            }
            if (settings) {
                this.#state.set('session.settings', settings);
            }
        } catch { }
    }

    async saveFile(file) {
        await FileStore.put(file);
        this.#state.set(`session.files.${file.name}`, file);
    }

    async saveResult(name, result) {
        await ResultStore.put(name, result);
        this.#state.set(`session.results.${name}`, result);
    }

    async removeFile(name) {
        await FileStore.delete(name);
        await ResultStore.delete(name);
        const files = this.#state.get('session.files') || {};
        delete files[name];
        this.#state.set('session.files', { ...files });
    }

    async saveSetting(key, value) {
        await SettingsStore.put(key, value);
        this.#state.set(`session.settings.${key}`, value);
    }

    async saveHistory(entry) {
        await HistoryStore.put(entry);
    }

    async exportSession() {
        const files = await FileStore.getAll();
        const results = await ResultStore.getAll();
        const settings = await SettingsStore.getAll();
        const blob = new Blob([JSON.stringify({ files, results, settings, exportedAt: Date.now() }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devlens-session-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async importSession(jsonText) {
        const data = JSON.parse(jsonText);
        for (const file of (data.files || [])) {
            await FileStore.put(file);
            this.#state.set(`session.files.${file.name}`, file);
        }
        this.#bus.emit('session:imported', data);
    }
}