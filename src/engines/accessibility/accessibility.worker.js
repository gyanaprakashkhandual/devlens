self.onmessage = (e) => {
    const { id, html } = e.data;
    try {
        const findings = auditHTMLStatic(html);
        self.postMessage({ id, findings });
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};

function auditHTMLStatic(html) {
    const findings = [];

    const make = (criterion, id, message, snippet = '', detail = '') => ({ criterion, id, pass: false, message, snippet: snippet.slice(0, 120), detail });

    const imgRe = /<img(?![^>]*\balt\s*=)[^>]*>/gi;
    let m;
    while ((m = imgRe.exec(html)) !== null) {
        findings.push(make('1.1.1', 'img-alt', 'Image missing alt attribute.', m[0]));
    }

    const inputRe = /<input(?:[^>]*)>/gi;
    while ((m = inputRe.exec(html)) !== null) {
        const tag = m[0];
        if (/type\s*=\s*['"]?(?:hidden|submit|button|reset|image)/i.test(tag)) continue;
        const idMatch = tag.match(/id\s*=\s*['"]([^'"]+)['"]/i);
        const hasAria = /aria-label\s*=|aria-labelledby\s*=/i.test(tag);
        if (!hasAria && idMatch) {
            const forPattern = new RegExp(`<label[^>]+for\\s*=\\s*['"]${idMatch[1]}['"]`, 'i');
            if (!forPattern.test(html)) {
                findings.push(make('1.3.1', 'input-label', 'Form input missing associated label.', tag));
            }
        } else if (!hasAria) {
            findings.push(make('1.3.1', 'input-label', 'Form input missing associated label.', tag));
        }
    }

    const btnRe = /<button(?:[^>]*)>([\s\S]*?)<\/button>/gi;
    while ((m = btnRe.exec(html)) !== null) {
        const inner = m[2] || m[1];
        const hasAriaLabel = /aria-label\s*=|aria-labelledby\s*=/i.test(m[0]);
        if (!inner?.trim() && !hasAriaLabel) {
            findings.push(make('4.1.2', 'button-name', 'Button has no accessible name.', m[0].slice(0, 80)));
        }
    }

    const headingLevels = [];
    const headingRe = /<h([1-6])[^>]*>/gi;
    while ((m = headingRe.exec(html)) !== null) headingLevels.push({ level: parseInt(m[1]), snippet: m[0] });
    for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i].level > headingLevels[i - 1].level + 1) {
            findings.push(make('1.3.1', 'heading-order', `Heading level skipped from h${headingLevels[i - 1].level} to h${headingLevels[i].level}.`, headingLevels[i].snippet));
        }
    }

    if (!/<html[^>]+lang\s*=/i.test(html)) {
        findings.push(make('3.1.1', 'lang', 'Missing lang attribute on <html> element.', '<html>'));
    }

    const iframeRe = /<iframe(?![^>]*\btitle\s*=)[^>]*>/gi;
    while ((m = iframeRe.exec(html)) !== null) {
        findings.push(make('4.1.2', 'iframe-title', 'iframe missing title attribute.', m[0]));
    }

    const tabRe = /tabindex\s*=\s*['"]?([0-9]+)/gi;
    while ((m = tabRe.exec(html)) !== null) {
        if (parseInt(m[1]) > 0) findings.push(make('2.4.3', 'tabindex', `tabindex="${m[1]}" disrupts natural tab order.`, m[0]));
    }

    const autoplayRe = /<(?:video|audio)[^>]+autoplay/gi;
    while ((m = autoplayRe.exec(html)) !== null) {
        findings.push(make('1.4.2', 'autoplay', 'Media with autoplay may disorient users.', m[0].slice(0, 80)));
    }

    const linkRe = /<a\s[^>]*href[^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = linkRe.exec(html)) !== null) {
        const inner = m[1]?.trim();
        const hasAriaLabel = /aria-label\s*=|aria-labelledby\s*=/i.test(m[0]);
        if (!inner && !hasAriaLabel) {
            findings.push(make('2.4.4', 'link-name', 'Link has no accessible name.', m[0].slice(0, 80)));
        }
    }

    const passes = [
        { criterion: '1.1.1', id: 'img-alt', message: 'All images have alt attributes' },
        { criterion: '3.1.1', id: 'lang', message: 'HTML lang attribute present' },
    ].filter(p => !findings.some(f => f.id === p.id)).map(p => ({ ...p, pass: true }));

    return [...findings, ...passes];
}