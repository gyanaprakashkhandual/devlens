self.onmessage = (e) => {
    const { id, source } = e.data;
    try {
        const findings = profileSource(source);
        self.postMessage({ id, findings });
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};

function profileSource(source) {
    const lines = source.split('\n');
    const fnPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|(\w+)\s*:\s*(?:async\s+)?function)\s*\(/g;
    const functions = [];
    for (let i = 0; i < lines.length; i++) {
        let m;
        while ((m = fnPattern.exec(lines[i])) !== null) {
            const name = m[1] || m[2] || m[3] || '(anonymous)';
            functions.push({ name, line: i + 1, snippet: lines[i].trim().slice(0, 80) });
        }
    }

    const longTasks = [];
    const loopPattern = /(?:while\s*\(true\)|for\s*\(;;)|setInterval\s*\(|requestAnimationFrame\s*\(/g;
    for (let i = 0; i < lines.length; i++) {
        if (loopPattern.test(lines[i])) {
            longTasks.push({ line: i + 1, snippet: lines[i].trim().slice(0, 80), reason: 'Potential long-running loop or continuous timer detected.' });
        }
        loopPattern.lastIndex = 0;
    }

    const syncIOPattern = /(?:XMLHttpRequest|\.open\s*\(|\.send\s*\()/g;
    const syncIssues = [];
    for (let i = 0; i < lines.length; i++) {
        if (syncIOPattern.test(lines[i])) {
            syncIssues.push({ line: i + 1, snippet: lines[i].trim().slice(0, 80), reason: 'Synchronous XHR blocks the main thread.' });
        }
        syncIOPattern.lastIndex = 0;
    }

    const domQueryPattern = /document\.querySelector(?:All)?\s*\(|document\.getElementById\s*\(|document\.getElementsBy/g;
    const domQueries = [];
    for (let i = 0; i < lines.length; i++) {
        if (domQueryPattern.test(lines[i])) {
            domQueries.push({ line: i + 1, snippet: lines[i].trim().slice(0, 80) });
        }
        domQueryPattern.lastIndex = 0;
    }

    const domInLoopIssues = [];
    for (let i = 0; i < domQueries.length; i++) {
        const q = domQueries[i];
        const contextStart = Math.max(0, q.line - 5);
        const contextLines = lines.slice(contextStart, q.line).join('\n');
        if (/for\s*\(|while\s*\(/.test(contextLines)) {
            domInLoopIssues.push({ ...q, reason: 'DOM query inside a loop causes repeated layout reflows.' });
        }
    }

    return { functions, longTasks, syncIssues, domInLoopIssues, summary: { functionCount: functions.length, longTaskCount: longTasks.length, syncIOCount: syncIssues.length, domInLoopCount: domInLoopIssues.length } };
}