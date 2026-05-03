export function serialize(value, maxDepth = 6) {
    return JSON.stringify(value, replacer(maxDepth), 2);
}

export function deserialize(str) {
    try { return JSON.parse(str); }
    catch { return null; }
}

function replacer(maxDepth) {
    const seen = new WeakSet();
    return function(key, value) {
        if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
        if (typeof value === 'symbol') return `[Symbol: ${value.toString()}]`;
        if (typeof value === 'bigint') return `${value}n`;
        if (value instanceof Error) return { __type: 'Error', message: value.message, stack: value.stack };
        if (value instanceof Map) return { __type: 'Map', entries: [...value.entries()] };
        if (value instanceof Set) return { __type: 'Set', values: [...value.values()] };
        if (value instanceof RegExp) return { __type: 'RegExp', source: value.source, flags: value.flags };
        if (value instanceof Date) return { __type: 'Date', iso: value.toISOString() };
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
        }
        return value;
    };
}

export function safeStringify(value) {
    try { return serialize(value); }
    catch { return String(value); }
}

export function cloneDeep(value) {
    try { return structuredClone(value); }
    catch { return deserialize(JSON.stringify(value)); }
}

export function compressSession(data) {
    const json = JSON.stringify(data);
    const encoded = btoa(encodeURIComponent(json));
    return encoded;
}

export function decompressSession(encoded) {
    try {
        const json = decodeURIComponent(atob(encoded));
        return JSON.parse(json);
    } catch { return null; }
}