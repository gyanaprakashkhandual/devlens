import { idbPut, idbGetAll, idbDelete } from './IDBAdapter.js';

export const HistoryStore = {
    getAll: () => idbGetAll('history'),

    put: (entry) => idbPut('history', {
        ...entry,
        id: entry.id || crypto.randomUUID(),
        timestamp: entry.timestamp || Date.now(),
    }),

    getLast: async (n = 50) => {
        const all = await idbGetAll('history');
        return (all || []).sort((a, b) => b.timestamp - a.timestamp).slice(0, n);
    },

    delete: (id) => idbDelete('history', id),
};