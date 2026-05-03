import { FindingCard } from '../components/FindingCard.js';
import { Toast } from '../components/Toast.js';

export class MemoryPanel {
    #el;
    #bus;
    #state;
    #worker = null;
    #resultsEl;
    #summaryEl;

    constructor(bus, state) {
        this.#bus = bus;
        this.#state = state;
        this.#el = document.createElement('div');
        this.#el.className = 'panel memory-panel';
        this.#build();
        this.#spawnWorker();
    }

    get element() { return this.#el; }

    #build() {
        this.#el.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">Memory Leak Detector</h2>
                <button class="run-btn" aria-label="Run memory analysis">Detect Leaks</button>
            </div>
            <div class="memory-summary" aria-live="polite"></div>
            <div class="memory-results" role="list" aria-label="Memory findings" aria-live="polite"></div>
        `;
        this.#summaryEl = this.#el.querySelector('.memory-summary');
        this.#resultsEl = this.#el.querySelector('.memory-results');
        this.#el.querySelector('.run-btn').addEventListener('click', () => this.#run());
    }

    #spawnWorker() {
        try {
            this.#worker = new Worker('./src/engines/memory/memory.worker.js', { type: 'module' });
            this.#worker.onmessage = (e) => this.#onResult(e.data);
        } catch { Toast.warn('Memory worker unavailable.'); }
    }

    #run() {
        const activeFile = this.#state.get('session.activeFile');
        const file = activeFile ? this.#state.get(`session.files.${activeFile}`) : null;
        if (!file || !['javascript', 'typescript'].includes(file.type)) {
            Toast.warn('Select a JavaScript file to analyze for memory leaks.');
            return;
        }
        this.#worker?.postMessage({ id: activeFile, source: file.content });
        this.#resultsEl.innerHTML = '<div class="empty-state">Analyzing...</div>';
        this.#summaryEl.innerHTML = '';
    }

    #onResult(data) {
        if (data.error) { Toast.error(`Memory analysis error: ${data.error}`); return; }
        const findings = data.findings || [];
        this.#state.set(`session.results.${data.id}.memory`, findings);
        this.#renderSummary(findings);
        this.#renderFindings(findings);
    }

    #renderSummary(findings) {
        const high = findings.filter(f => f.severity === 'high').length;
        const medium = findings.filter(f => f.severity === 'medium').length;
        const low = findings.filter(f => f.severity === 'low').length;
        this.#summaryEl.innerHTML = findings.length
            ? `<div class="memory-stats"><span class="sev-high">${high} high</span><span class="sev-medium">${medium} medium</span><span class="sev-low">${low} low</span></div>`
            : '';
    }

    #renderFindings(findings) {
        this.#resultsEl.innerHTML = '';
        if (!findings.length) {
            this.#resultsEl.innerHTML = '<div class="empty-state success">No memory leak patterns detected.</div>';
            return;
        }
        for (const f of findings) {
            this.#resultsEl.appendChild(FindingCard.render({
                ruleId: f.type,
                severity: f.severity,
                message: f.description,
                line: f.line,
                snippet: f.snippet,
            }, null));
        }
    }

    onActivate() {}
    onDeactivate() {}
}