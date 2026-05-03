const ARIA_ROLE_REQUIRED_ATTRS = {
    slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    scrollbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-controls'],
    combobox: ['aria-expanded'],
    checkbox: ['aria-checked'],
    option: ['aria-selected'],
    radio: ['aria-checked'],
    progressbar: ['aria-valuenow'],
    spinbutton: ['aria-valuenow'],
    tab: ['aria-selected'],
    treeitem: ['aria-expanded'],
};

const VALID_ARIA_ROLES = new Set([
    'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
    'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition',
    'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell',
    'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
    'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
    'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
    'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search',
    'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab',
    'table', 'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip',
    'tree', 'treegrid', 'treeitem',
]);

export function validateARIA(el) {
    const findings = [];
    const role = el.getAttribute('role');

    if (role && !VALID_ARIA_ROLES.has(role)) {
        findings.push({
            criterion: '4.1.2',
            id: 'aria-role-valid',
            pass: false,
            message: `Invalid ARIA role '${role}'.`,
            element: el.outerHTML?.slice(0, 120),
        });
    }

    if (role && ARIA_ROLE_REQUIRED_ATTRS[role]) {
        for (const attr of ARIA_ROLE_REQUIRED_ATTRS[role]) {
            if (!el.hasAttribute(attr)) {
                findings.push({
                    criterion: '4.1.2',
                    id: 'aria-required-attr',
                    pass: false,
                    message: `Element with role='${role}' is missing required attribute '${attr}'.`,
                    element: el.outerHTML?.slice(0, 120),
                });
            }
        }
    }

    return findings;
}

export function validateARIAStatic(html) {
    const findings = [];
    const roleRe = /role\s*=\s*['"]([^'"]+)['"]/gi;
    let m;
    while ((m = roleRe.exec(html)) !== null) {
        const role = m[1].trim().toLowerCase();
        if (!VALID_ARIA_ROLES.has(role)) {
            findings.push({
                criterion: '4.1.2',
                id: 'aria-role-valid',
                pass: false,
                message: `Invalid ARIA role '${role}'.`,
                element: html.slice(Math.max(0, m.index - 20), m.index + 60),
            });
        }
    }
    return findings;
}

/*
const ARIA_ROLE_REQUIRED_ATTRS = {
    slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    scrollbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-controls'],
    combobox: ['aria-expanded'],
    checkbox: ['aria-checked'],
    option: ['aria-selected'],
    radio: ['aria-checked'],
    progressbar: ['aria-valuenow'],
    spinbutton: ['aria-valuenow'],
    tab: ['aria-selected'],
    treeitem: ['aria-expanded'],
};

const VALID_ARIA_ROLES = new Set([
    'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
    'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition',
    'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell',
    'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
    'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
    'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
    'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search',
    'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab',
    'table', 'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip',
    'tree', 'treegrid', 'treeitem',
]);

export function validateARIA(el) {
    const findings = [];
    const role = el.getAttribute('role');

    if (role && !VALID_ARIA_ROLES.has(role)) {
        findings.push({
            criterion: '4.1.2',
            id: 'aria-role-valid',
            pass: false,
            message: `Invalid ARIA role '${role}'.`,
            element: el.outerHTML?.slice(0, 120),
        });
    }

    if (role && ARIA_ROLE_REQUIRED_ATTRS[role]) {
        for (const attr of ARIA_ROLE_REQUIRED_ATTRS[role]) {
            if (!el.hasAttribute(attr)) {
                findings.push({
                    criterion: '4.1.2',
                    id: 'aria-required-attr',
                    pass: false,
                    message: `Element with role='${role}' is missing required attribute '${attr}'.`,
                    element: el.outerHTML?.slice(0, 120),
                });
            }
        }
    }

    return findings;
}

export function validateARIAStatic(html) {
    const findings = [];
    const roleRe = /role\s*=\s*['"]([^'"]+)['"]/gi;
    let m;
    while ((m = roleRe.exec(html)) !== null) {
        const role = m[1].trim().toLowerCase();
        if (!VALID_ARIA_ROLES.has(role)) {
            findings.push({
                criterion: '4.1.2',
                id: 'aria-role-valid',
                pass: false,
                message: `Invalid ARIA role '${role}'.`,
                element: html.slice(Math.max(0, m.index - 20), m.index + 60),
            });
        }
    }
    return findings;
}
*/