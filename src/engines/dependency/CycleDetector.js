export function detectCycles(nodes, edges) {
    const adj = new Map(nodes.map(n => [n.id, []]));
    for (const edge of edges) {
        adj.get(edge.from)?.push(edge.to);
    }

    const cycles = [];
    const visited = new Set();
    const recStack = new Set();
    const path = [];

    const dfs = (nodeId) => {
        visited.add(nodeId);
        recStack.add(nodeId);
        path.push(nodeId);
        for (const neighbor of (adj.get(nodeId) || [])) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor)) return true;
            } else if (recStack.has(neighbor)) {
                const cycleStart = path.indexOf(neighbor);
                cycles.push([...path.slice(cycleStart), neighbor]);
            }
        }
        path.pop();
        recStack.delete(nodeId);
        return false;
    };

    for (const node of nodes) {
        if (!visited.has(node.id)) dfs(node.id);
    }

    return cycles;
}