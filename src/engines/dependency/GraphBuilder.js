export function buildGraph(files) {
    const nodeMap = new Map();
    const edges = [];

    const getNode = (name) => {
        if (!nodeMap.has(name)) {
            nodeMap.set(name, { id: crypto.randomUUID(), name, imports: 0, exports: 0 });
        }
        return nodeMap.get(name);
    };

    for (const [filename, importsArr] of Object.entries(files)) {
        getNode(filename);
        for (const imp of importsArr) {
            const target = resolveImport(imp.to, filename);
            const fromNode = getNode(filename);
            const toNode = getNode(target);
            fromNode.imports++;
            toNode.exports++;
            edges.push({ from: fromNode.id, to: toNode.id, type: imp.type, source: imp.to, line: imp.line });
        }
    }

    const nodes = [...nodeMap.values()];
    return { nodes, edges };
}

function resolveImport(importPath, fromFile) {
    if (!importPath.startsWith('.')) return importPath;
    const dir = fromFile.includes('/') ? fromFile.slice(0, fromFile.lastIndexOf('/') + 1) : '';
    let resolved = dir + importPath;
    resolved = resolved.replace(/\/\.\//g, '/').replace(/\/[^/]+\/\.\.\//g, '/');
    if (!resolved.match(/\.\w+$/)) resolved += '.js';
    return resolved;
}