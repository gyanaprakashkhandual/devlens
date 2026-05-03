import { idbGet, idbPut, idbGetAll } from './IDBAdapter.js';

const DEFAULTS = {
    theme: 'dark',
    complexityThreshold: 10,
    nestingThreshold: 4,
    fileSizeLimit: 2097152,
    contrastThreshold: 4.5,
    editorTabSize: 2,
    autoAnalyze: true,
    fontSize: 13,
};

export const SettingsStore = {
    getAll: async () => {
        const items = await idbGetAll('settings');
        const stored = Object.fromEntries((items || []).map(i => [i.key, i.value]));
        return { ...DEFAULTS, ...stored };
    },

    put: (key, value) => idbPut('settings', { key, value }),

    get: async (key) => {
        const item = await idbGet('settings', key);
        return item?.value ?? DEFAULTS[key] ?? null;
    },

    getDefaults: () => ({ ...DEFAULTS }),
};