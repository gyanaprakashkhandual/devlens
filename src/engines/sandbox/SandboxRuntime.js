(function () {
    const parent = window.parent;
    const send = (type, data) => parent.postMessage({ source: 'devlens-sandbox', type, data }, '*');

    const origConsole = {};
    ['log', 'warn', 'error', 'table', 'info'].forEach(method => {
        origConsole[method] = console[method].bind(console);
        console[method] = (...args) => {
            origConsole[method](...args);
            send('console', { method, args: args.map(safeSerialize), timestamp: performance.now() });
        };
    });

    function safeSerialize(v) {
        if (v === null) return 'null';
        if (v === undefined) return 'undefined';
        if (typeof v === 'function') return `[Function: ${v.name || 'anonymous'}]`;
        if (typeof v === 'object') {
            try { return JSON.stringify(v, null, 2).slice(0, 500); }
            catch { return '[Object]'; }
        }
        return String(v);
    }

    window.__devlens_step__ = null;
    window.__devlens_breakpoints__ = new Set();
    window.__devlens_paused__ = false;

    window.addEventListener('message', (e) => {
        const msg = e.data;
        if (!msg || msg.source !== 'devlens-parent') return;
        if (msg.type === 'run') executeCode(msg.code, false);
        if (msg.type === 'step-run') executeCode(msg.code, true, msg.breakpoints || []);
        if (msg.type === 'resume') { window.__devlens_paused__ = false; if (window.__devlens_resume__) window.__devlens_resume__(); }
        if (msg.type === 'set-breakpoints') window.__devlens_breakpoints__ = new Set(msg.breakpoints);
    });

    function executeCode(code, stepping, breakpoints = []) {
        window.__devlens_breakpoints__ = new Set(breakpoints);
        send('start', {});
        try {
            const fn = new Function(code);
            fn();
            send('done', { success: true });
        } catch (err) {
            send('error', { message: err.message, stack: err.stack });
            send('done', { success: false });
        }
    }

    send('ready', {});
})();