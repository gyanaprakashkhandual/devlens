import { checkContrast } from './ContrastCalculator.js';

export function auditDOM(doc) {
    const findings = [];

    const make = (criterion, id, pass, message, element, detail = '') => ({
        criterion, id, pass, message, element: element?.outerHTML?.slice(0, 120), detail,
    });

    const imgs = doc.querySelectorAll('img');
    for (const img of imgs) {
        if (!img.hasAttribute('alt')) {
            findings.push(make('1.1.1', 'img-alt', false, 'Image missing alt attribute.', img, img.src));
        }
    }

    const inputs = doc.querySelectorAll('input, select, textarea');
    for (const input of inputs) {
        const id = input.id;
        const hasLabel = (id && doc.querySelector(`label[for="${id}"]`)) ||
            input.getAttribute('aria-label') ||
            input.getAttribute('aria-labelledby');
        if (!hasLabel) {
            findings.push(make('1.3.1', 'input-label', false, 'Form control missing associated label.', input));
        }
    }

    const buttons = doc.querySelectorAll('button, [role="button"]');
    for (const btn of buttons) {
        const name = btn.textContent?.trim() || btn.getAttribute('aria-label') || btn.getAttribute('aria-labelledby');
        if (!name) {
            findings.push(make('4.1.2', 'button-name', false, 'Button has no accessible name.', btn));
        }
    }

    const links = doc.querySelectorAll('a[href]');
    for (const a of links) {
        if (!a.textContent?.trim() && !a.getAttribute('aria-label')) {
            findings.push(make('2.4.4', 'link-name', false, 'Link has no accessible name.', a));
        }
    }

    const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')];
    let prevLevel = 0;
    for (const h of headings) {
        const level = parseInt(h.tagName[1]);
        if (level > prevLevel + 1) {
            findings.push(make('1.3.1', 'heading-order', false, `Heading level skipped: h${prevLevel} to h${level}.`, h));
        }
        prevLevel = level;
    }

    const html = doc.querySelector('html');
    if (!html?.getAttribute('lang')) {
        findings.push(make('3.1.1', 'lang', false, 'Missing lang attribute on <html> element.', html));
    }

    const iframes = doc.querySelectorAll('iframe');
    for (const iframe of iframes) {
        if (!iframe.getAttribute('title')) {
            findings.push(make('4.1.2', 'iframe-title', false, 'iframe missing title attribute.', iframe));
        }
    }

    const highTabIndex = doc.querySelectorAll('[tabindex]');
    for (const el of highTabIndex) {
        if (parseInt(el.getAttribute('tabindex')) > 0) {
            findings.push(make('2.4.3', 'tabindex', false, `tabindex="${el.getAttribute('tabindex')}" disrupts natural tab order.`, el));
        }
    }

    const media = doc.querySelectorAll('video[autoplay], audio[autoplay]');
    for (const m of media) {
        findings.push(make('1.4.2', 'autoplay', false, 'Media with autoplay may disorient users.', m));
    }

    const textEls = doc.querySelectorAll('p, span, div, li, td, th, h1, h2, h3, h4, h5, h6, a, button, label');
    const contrastIssues = new Set();
    for (const el of textEls) {
        if (!el.textContent?.trim()) continue;
        const style = window.getComputedStyle(el);
        const fg = style.color;
        const bg = style.backgroundColor;
        if (fg === bg) continue;
        const key = `${fg}|${bg}`;
        if (contrastIssues.has(key)) continue;
        const fontSize = parseFloat(style.fontSize);
        const isBold = parseInt(style.fontWeight) >= 700;
        const result = checkContrast(fg, bg, fontSize, isBold);
        if (result && !result.passes) {
            contrastIssues.add(key);
            findings.push(make('1.4.3', 'color-contrast', false, `Contrast ratio ${result.ratio.toFixed(2)}:1 fails (required ${result.required}:1).`, el, `FG: ${fg}, BG: ${bg}`));
        }
    }

    return findings;
}