import { FindingCard } from '../components/FindingCard.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { Toast } from '../components/Toast.js';

export class AnalysisPanel {
    #el;
    #bus;
    #state;
    #worker = null;
    #progress;
    #resultsEl;
    #summaryEl;
    #editorPanel;

    constructor(bus, state, editorPanel) {
        this.#bus = bus;
        this.#state = state;
        this.#editorPanel = editorPanel;
        this.#el = document.createElement('div');
        this.#el.className = 'panel analysis-panel';
        this.#build();
        this.#bindEvents();
        this.#spawnWorker();
    }

    get element() { return this.#el; }

    #build() {
        this.#el.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">Static Analysis</h2>
                <div class="panel-controls">
                    <select class="filter-select" aria-label="Filter by severity">
                        <option value="all">All</option>
                        <option value="error">Errors</option>
                        <option value="warning">Warnings</option>
                        <option value="info">Info</option>
                    </select>
                    <button class="run-btn" aria-label="Run analysis">Run Analysis</button>
                </div>
            </div>
            <div class="panel-progress"></div>
            <div class="panel-summary"></div>
            <div class="panel-results" role="list" aria-label="Analysis findings" aria-live="polite"></div>
        `;
        this.#progress = new ProgressBar(this.#el.querySelector('.panel-progress'), { label: 'Analysis progress' });
        this.#progress.hide();
        this.#resultsEl = this.#el.querySelector('.panel-results');
        this.#summaryEl = this.#el.querySelector('.panel-summary');

        this.#el.querySelector('.run-btn').addEventListener('click', () => this.#run());
        this.#el.querySelector('.filter-select').addEventListener('change', (e) => this.#applyFilter(e.target.value));
    }

    #bindEvents() {
        this.#bus.on('ingestion:file-ready', () => this.#run());
        this.#bus.on('toolbar:re-analyze', () => this.#run());
        this.#bus.on('editor:change', () => {});
    }

    #spawnWorker() {
        try {
            this.#worker = new Worker('./src/engines/ast/ast.worker.js', { type: 'module' });
            this.#worker.onmessage = (e) => this.#onWorkerResult(e.data);
            this.#worker.onerror = (e) => { Toast.error(`AST worker error: ${e.message}`); this.#progress.hide(); };
        } catch (e) {
            Toast.warn('Web Worker unavailable. Analysis disabled.');
        }
    }

    #run() {
        const activeFile = this.#state.get('session.activeFile');
        const file = activeFile ? this.#state.get(`session.files.${activeFile}`) : null;
        if (!file || !['javascript', 'typescript'].includes(file.type)) {
            this.#resultsEl.innerHTML = '<div class="empty-state">Select a JavaScript or TypeScript file to analyze.</div>';
            return;
        }
        if (!this.#worker) return;
        this.#progress.show();
        this.#progress.setIndeterminate(true);
        this.#resultsEl.innerHTML = '';
        this.#summaryEl.innerHTML = '';
        const config = this.#state.get('session.settings') || {};
        this.#worker.postMessage({ id: activeFile, source: file.content, config });
    }

    #onWorkerResult(data) {
        this.#progress.hide();
        if (data.error) { Toast.error(`Parse error: ${data.error}`); return; }
        const findings = data.findings || [];
        this.#state.set(`session.results.${data.id}.analysis`, findings);
        this.#renderSummary(findings);
        this.#renderFindings(findings, 'all');
        if (data.scopeTree) this.#bus.emit('analysis:scope-ready', { scopeTree: data.scopeTree, fileId: data.id });
        if (findings.length === 0) Toast.success('No issues found.');
    }

    #renderSummary(findings) {
        const errors = findings.filter(f => f.severity === 'error').length;
        const warnings = findings.filter(f => f.severity === 'warning').length;
        const infos = findings.filter(f => f.severity === 'info').length;
        this.#summaryEl.innerHTML = `
            <div class="summary-bar">
                <span class="summary-count error">${errors} error${errors !== 1 ? 's' : ''}</span>
                <span class="summary-count warning">${warnings} warning${warnings !== 1 ? 's' : ''}</span>
                <span class="summary-count info">${infos} info</span>
            </div>
        `;
    }

    #renderFindings(findings, filter) {
        this.#resultsEl.innerHTML = '';
        const filtered = filter === 'all' ? findings : findings.filter(f => f.severity === filter);
        if (!filtered.length) { this.#resultsEl.innerHTML = '<div class="empty-state">No findings match the filter.</div>'; return; }
        for (const f of filtered) {
            this.#resultsEl.appendChild(FindingCard.render(f, (line) => {
                this.#editorPanel?.jumpToLine(line);
                this.#bus.emit('panel:activated', { id: 'editor' });
            }));
        }
    }

    #applyFilter(value) {
        const activeFile = this.#state.get('session.activeFile');
        const findings = this.#state.get(`session.results.${activeFile}.analysis`) || [];
        this.#renderFindings(findings, value);
    }

    onActivate() { }
    onDeactivate() { }
}