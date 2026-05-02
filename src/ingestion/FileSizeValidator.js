const MAX_SINGLE_FILE = 2 * 1024 * 1024;
const MAX_TOTAL = 10 * 1024 * 1024;
const MAX_FILES = 20;
const ALLOWED_TYPES = new Set(['.js', '.mjs', '.ts', '.html', '.css', '.json']);

export function validateFile(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.has(ext)) {
        return { valid: false, error: `File type '${ext}' is not supported. Allowed: ${[...ALLOWED_TYPES].join(', ')}` };
    }
    if (file.size > MAX_SINGLE_FILE) {
        return { valid: false, error: `'${file.name}' exceeds the 2MB per-file limit (size: ${formatBytes(file.size)}).` };
    }
    return { valid: true, error: null };
}

export function validateBatch(files) {
    if (files.length > MAX_FILES) {
        return { valid: false, error: `Too many files. Maximum is ${MAX_FILES}, got ${files.length}.` };
    }
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL) {
        return { valid: false, error: `Total payload exceeds 10MB limit (total: ${formatBytes(totalSize)}).` };
    }
    return { valid: true, error: null };
}

export function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}