export function relativeLuminance(r, g, b) {
    const linearize = (c) => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

export function parseColor(colorStr) {
    if (!colorStr) return null;
    const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

export function blendWithBackground(fg, bg) {
    if (!fg || !bg) return fg;
    const a = fg.a;
    return {
        r: Math.round(fg.r * a + bg.r * (1 - a)),
        g: Math.round(fg.g * a + bg.g * (1 - a)),
        b: Math.round(fg.b * a + bg.b * (1 - a)),
        a: 1,
    };
}

export function checkContrast(fgStr, bgStr, fontSize = 16, isBold = false) {
    const fg = parseColor(fgStr);
    const bg = parseColor(bgStr);
    if (!fg || !bg) return null;
    const blended = fg.a < 1 ? blendWithBackground(fg, bg) : fg;
    const l1 = relativeLuminance(blended.r, blended.g, blended.b);
    const l2 = relativeLuminance(bg.r, bg.g, bg.b);
    const ratio = contrastRatio(l1, l2);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
    const required = isLargeText ? 3 : 4.5;
    return { ratio, passes: ratio >= required, required, isLargeText };
}