export function detectLeaks(source) {
    const findings = [];
    const lines = source.split('\n');

    const addEventListeners = [];
    const removeEventListeners = [];
    const intervals = [];
    const clearIntervals = [];

    const addListenerRe = /\.addEventListener\s*\(\s*['"](\w+)['"]/g;
    const removeListenerRe = /\.removeEventListener\s*\(\s*['"](\w+)['"]/g;
    const setIntervalRe = /setInterval\s*\(/g;
    const clearIntervalRe = /clearInterval\s*\(/g;
    const growingArrayRe = /(\w+)\.push\s*\(/g;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let m;
        while ((m = addListenerRe.exec(line)) !== null) {
            addEventListeners.push({ event: m[1], line: i + 1, col: m.index });
        }
        while ((m = removeListenerRe.exec(line)) !== null) {
            removeEventListeners.push({ event: m[1], line: i + 1 });
        }
        while ((m = setIntervalRe.exec(line)) !== null) {
            intervals.push({ line: i + 1, snippet: line.trim().slice(0, 60) });
        }
        while ((m = clearIntervalRe.exec(line)) !== null) {
            clearIntervals.push({ line: i + 1 });
        }
    }

    const addByEvent = new Map();
    for (const al of addEventListeners) {
        addByEvent.set(al.event, (addByEvent.get(al.event) || 0) + 1);
    }
    const removeByEvent = new Map();
    for (const rl of removeEventListeners) {
        removeByEvent.set(rl.event, (removeByEvent.get(rl.event) || 0) + 1);
    }

    for (const [event, count] of addByEvent) {
        const removed = removeByEvent.get(event) || 0;
        if (count > removed) {
            const entry = addEventListeners.find(a => a.event === event);
            findings.push({
                type: 'Event listener accumulation',
                severity: count > 3 ? 'high' : 'medium',
                description: `addEventListener('${event}') called ${count} time(s) with no corresponding removeEventListener.`,
                line: entry?.line || 0,
                snippet: lines[(entry?.line || 1) - 1]?.trim() || '',
            });
        }
    }

    if (intervals.length > clearIntervals.length) {
        const diff = intervals.length - clearIntervals.length;
        findings.push({
            type: 'Interval accumulation',
            severity: diff > 2 ? 'high' : 'medium',
            description: `${diff} setInterval call(s) without corresponding clearInterval.`,
            line: intervals[0]?.line || 0,
            snippet: intervals[0]?.snippet || '',
        });
    }

    const growingCollections = new Map();
    const growRe = /(\w+)\.push\s*\(/g;
    for (let i = 0; i < lines.length; i++) {
        let m;
        while ((m = growRe.exec(lines[i])) !== null) {
            const varName = m[1];
            growingCollections.set(varName, (growingCollections.get(varName) || 0) + 1);
        }
    }
    for (const [name, count] of growingCollections) {
        if (count >= 2) {
            findings.push({
                type: 'Growing collection',
                severity: 'low',
                description: `'${name}' is pushed to ${count} times without any removal. May grow unboundedly.`,
                line: 0,
                snippet: '',
            });
        }
    }

    return findings;
}