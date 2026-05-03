import { FlameChart } from '../components/FlameChart.js';
import { FlameChartBuilder } from '../../engines/profiler/FlameChartBuilder.js';
import { Toast } from '../components/Toast.js';

export class ProfilerPanel {
    #el;
    #bus;
    #state;
    #worker = null;
    #flameChart;
    #builder = new FlameChartBuilder();
    #tableEl;
    #summaryEl;

    constructor(bus, state) {
        this.#bus = bus;
        this.#state = state;
        this.#el = document.createElement('div');
        this.#el.className = 'panel profiler-panel';
        this.#build();
        this.#spawnWorker();
    }

    get element() { return this.#el; }

    #build() {
        this.#el.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">Performance Profiler</h2>
                <button class="run-btn" aria-label="Run profiler">Profile</button>
            </div>
            <div class="profiler-summary" aria-live="polite"></div>
            <div class="flame-chart-container" style="height:200px;"></div>
            <div class="profiler-table-container"></div>
        `;
        this.#summaryEl = this.#el.querySelector('.profiler-summary');
        this.#tableEl = this.#el.querySelector('.profiler-table-container');
        this.#flameChart = new FlameChart(this.#el.querySelector('.flame-chart-container'));
        this.#el.querySelector('.run-btn').addEventListener('click', () => this.#run());
    }

    #spawnWorker() {
        try {
            this.#worker = new Worker('./src/engines/profiler/profiler.worker.js', { type: 'module' });
            this.#worker.onmessage = (e) => this.#onResult(e.data);
        } catch { Toast.warn('Profiler worker unavailable.'); }
    }

    #run() {
        const activeFile = this.#state.get('session.activeFile');
        const file = activeFile ? this.#state.get(`session.files.${activeFile}`) : null;
        if (!file || !['javascript', 'typescript'].includes(file.type)) {
            Toast.warn('Select a JavaScript file to profile.');
            return;
        }
        this.#worker?.postMessage({ id: activeFile, source: file.content });
        this.#summaryEl.textContent = 'Profiling...';
    }

    #onResult(data) {
        if (data.error) { Toast.error(`Profiler error: ${data.error}`); return; }
        const { findings } = data;
        const chartData = this.#builder.build(findings);
        this.#flameChart.setData(chartData);
        this.#renderSummary(findings);
        this.#renderTable(findings);
    }

    #renderSummary(findings) {
        const s = findings.summary || {};
        this.#summaryEl.innerHTML = `
            <div class="profiler-stats">
                <span>${s.functionCount || 0} functions</span>
                <span>${s.longTaskCount || 0} long tasks</span>
                <span>${s.syncIOCount || 0} sync I/O calls</span>
                <span>${s.domInLoopCount || 0} DOM queries in loops</span>
            </div>
        `;
    }

    #renderTable(findings) {
        const issues = [
            ...(findings.longTasks || []).map(i => ({ ...i, category: 'Long Task' })),
            ...(findings.syncIssues || []).map(i => ({ ...i, category: 'Sync I/O' })),
            ...(findings.domInLoopIssues || []).map(i => ({ ...i, category: 'DOM in Loop' })),
        ];
        if (!issues.length) { this.#tableEl.innerHTML = '<div class="empty-state">No performance issues detected.</div>'; return; }
        const rows = issues.map(i => `
            <tr>
                <td>${i.category}</td>
                <td>${i.line || '-'}</td>
                <td><code>${i.snippet || ''}</code></td>
                <td>${i.reason || ''}</td>
            </tr>
        `).join('');
        this.#tableEl.innerHTML = `
            <table class="profiler-table">
                <thead><tr><th>Category</th><th>Line</th><th>Snippet</th><th>Reason</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    onActivate() {}
    onDeactivate() {}
}