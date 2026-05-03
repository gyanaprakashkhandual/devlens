export function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function countLines(text) {
    let count = 1;
    for (let i = 0; i < text.length; i++) { if (text[i] === '\n') count++; }
    return count;
}

export function countBytes(str) {
    return new TextEncoder().encode(str).length;
}

export function readableSize(n) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}