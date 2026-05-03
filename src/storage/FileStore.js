import { idbGet, idbPut, idbDelete, idbGetAll } from './IDBAdapter.js';

export const FileStore = {
    getAll: () => idbGetAll('files'),
    put: (file) => idbPut('files', file),
    delete: (name) => idbDelete('files', name),
    get: (name) => idbGet('files', name),
};