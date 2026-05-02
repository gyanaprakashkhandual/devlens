import { idbGet, idbPut, idbDelete, idbGetAll } from './idba.adpater';

export const FileStore = {
    getAll: () => idbGetAll('files'),
    put: (file) => idbPut('files', file),
    delete: (name) => idbDelete('files', name),
    get: (name) => idbGet('files', name),
};

export const ResultStore = {
    getAll: () => idbGetAll('results'),
    put: (name, result) => idbPut('results', { key: name, ...result }),
    delete: (name) => idbDelete('results', name),
    get: (name) => idbGet('results', name),
};

export const SettingsStore = {
    getAll: async () => {
        const items = await idbGetAll('settings');
        return Object.fromEntries(items.map(i => [i.key, i.value]));
    },
    put: (key, value) => idbPut('settings', { key, value }),
    get: async (key) => {
        const item = await idbGet('settings', key);
        return item?.value;
    },
};

export const HistoryStore = {
    getAll: () => idbGetAll('history'),
    put: (entry) => idbPut('history', { ...entry, id: entry.id || crypto.randomUUID() }),
};