export class ASTWalker {
    walk(node, visitors) {
        if (!node || typeof node !== 'object') return;
        const type = node.type;
        if (!type) {
            if (Array.isArray(node)) { for (const child of node) this.walk(child, visitors); }
            return;
        }
        const visitor = visitors[type] || visitors['*'];
        if (visitor) {
            if (typeof visitor === 'function') {
                visitor(node);
            } else if (typeof visitor === 'object') {
                if (typeof visitor.enter === 'function') visitor.enter(node);
            }
        }
        for (const key of Object.keys(node)) {
            if (key === 'type' || key === 'line' || key === 'col' || key === '__used') continue;
            const child = node[key];
            if (Array.isArray(child)) {
                for (const item of child) {
                    if (item && typeof item === 'object' && item.type) this.walk(item, visitors);
                }
            } else if (child && typeof child === 'object' && child.type) {
                this.walk(child, visitors);
            }
        }
        if (visitor && typeof visitor === 'object' && typeof visitor.exit === 'function') {
            visitor.exit(node);
        }
    }
}