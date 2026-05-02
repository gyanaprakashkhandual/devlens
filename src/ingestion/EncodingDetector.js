export function detectEncoding(buffer) {
    const bytes = new Uint8Array(buffer);

    if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le';
    if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be';
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'utf-8';

    let i = 0;
    let isValidUTF8 = true;
    while (i < Math.min(bytes.length, 4096)) {
        const b = bytes[i];
        if (b <= 0x7F) { i++; continue; }
        let extraBytes = 0;
        if ((b & 0xE0) === 0xC0) extraBytes = 1;
        else if ((b & 0xF0) === 0xE0) extraBytes = 2;
        else if ((b & 0xF8) === 0xF0) extraBytes = 3;
        else { isValidUTF8 = false; break; }
        for (let j = 1; j <= extraBytes; j++) {
            if (i + j >= bytes.length || (bytes[i + j] & 0xC0) !== 0x80) { isValidUTF8 = false; break; }
        }
        if (!isValidUTF8) break;
        i += 1 + extraBytes;
    }

    return isValidUTF8 ? 'utf-8' : 'windows-1252';
}

export function decodeBuffer(buffer) {
    const encoding = detectEncoding(buffer);
    const hasBOM = (encoding === 'utf-8' && new Uint8Array(buffer)[0] === 0xEF);
    const offset = hasBOM ? 3 : (encoding.startsWith('utf-16') ? 2 : 0);
    const sliced = buffer.slice(offset);
    try {
        return new TextDecoder(encoding).decode(sliced);
    } catch {
        return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    }
}