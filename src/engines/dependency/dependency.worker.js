import { parseImports } from './ImportParser.js';
import { buildGraph } from './GraphBuilder.js';
import { detectCycles } from './CycleDetector.js';

self.onmessage = (e) => {
    const { id, files } = e.data;
    try {
        const importMap = {};
        for (const [name, source] of Object.entries(files)) {
            importMap[name] = parseImports(source, name);
        }
        const { nodes, edges } = buildGraph(importMap);
        const cycles = detectCycles(nodes, edges);
        self.postMessage({ id, nodes, edges, cycles });
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};