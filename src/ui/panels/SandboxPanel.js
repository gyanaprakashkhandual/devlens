import { SandboxHost } from '../../engines/sandbox/SandboxHost.js';
import { StepExecutor } from '../../engines/sandbox/StepExecutor.js';
import { OutputCollector } from '../../engines/sandbox/OutputCollector.js';
import { CodeEditor } from '../components/CodeEditor.js';
import { SplitView } from '../layout/SplitView.js';
import { Toast } from '../components/Toast.js';
import { HistoryStore } from '../../storage/HistoryStore.js';

export class SandboxPanel {
    #el;
    #bus;
    #state;
    #host;
    #executor;
    #collector;
    #editor;
    #outputEl;
    #statusEl;
    #splitView;
    #isRunning = false;
    #breakpoints = [];

    constructor(bus, state) {
        this.#bus = bus;
        this.#state = state;
        this.#collector = new OutputCollector(500);
        this.#el = document.createElement('div');
        this.#el.className = 'panel sandbox-panel';
        this.#build();
        this.#bindEvents();
    }

    get element() { return this.#el; }

    #build() {
        this.#el.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">Live Sandbox</h2>
                <div class="sandbox-controls">
                    <button class="run-btn" data-action="run" aria-label="Run code (Ctrl+Shift+Enter)">Run</button>
                    <button class="run-btn secondary" data-action="step" aria-label="Step through code">Step</button>
                    <button class="run-btn secondary" data-action="resume" aria-label="Resume execution" disabled>Resume</button>
                    <button class="run-btn secondary" data-action="stop" aria-label="Stop execution" disabled>Stop</button>
                    <button class="run-btn secondary" data-action="clear" aria-label="Clear output">Clear</button>
                </div>
                <div class="sandbox-filter">
                    <select aria-label="Filter output by method">
                        <option value="all">All output</option>
                        <option value="log">log</option>
                        <option value="warn">warn</option>
                        <option value="error">error</option>
                    </select>
                </div>
            </div>
            <div class="sandbox-status" aria-live="polite" role="status"></div>
            <div class="sandbox-body" style="flex:1;display:flex;flex-direction:column;overflow:hidden;"></div>
        `;

        this.#statusEl = this.#el.querySelector('.sandbox-status');
        const body = this.#el.querySelector('.sandbox-body');

        this.#splitView = new SplitView(body, { direction: 'vertical', ratio: 0.55 });

        const editorContainer = document.createElement('div');
        editorContainer.style.cssText = 'height:100%;overflow:hidden;';
        this.#splitView.paneA.appendChild(editorContainer);

        this.#editor = new CodeEditor(editorContainer, {
            tabSize: 2,
            onChange: () => {},
            onBreakpointToggle: (bps) => { this.#breakpoints = bps; },
        });

        const outputWrapper = document.createElement('div');
        outputWrapper.style.cssText = 'height:100%;display:flex;flex-direction:column;overflow:hidden;';
        outputWrapper.innerHTML = `
            <div class="output-header">Output</div>
            <div class="output-console" role="log" aria-label="Sandbox output" aria-live="polite"></div>
        `;
        this.#splitView.paneB.appendChild(outputWrapper);
        this.#outputEl = outputWrapper.querySelector('.output-console');

        this.#el.querySelector('.sandbox-controls').addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'run') this.#run(false);
            if (action === 'step') this.#run(true);
            if (action === 'resume') this.#resume();
            if (action === 'stop') this.#stop();
            if (action === 'clear') this.#clearOutput();
        });

        this.#el.querySelector('.sandbox-filter select').addEventListener('change', (e) => {
            this.#renderOutput(e.target.value);
        });

        this.#collector.onEntry((entry) => {
            if (entry.type === 'clear') { this.#outputEl.innerHTML = ''; return; }
            this.#appendEntry(entry);
        });
    }

    async #initHost() {
        if (this.#host) return;
        const container = document.createElement('div');
        container.style.display = 'none';
        this.#el.appendChild(container);
        this.#host = new SandboxHost(this.#bus);
        await this.#host.mount(container);

        this.#host.on('console', (data) => { this.#collector.push(data); });
        this.#host.on('start', () => { this.#setRunning(true); this.#statusEl.textContent = 'Running...'; });
        this.#host.on('done', (data) => {
            this.#setRunning(false);
            this.#statusEl.textContent = data.success ? 'Completed.' : 'Completed with errors.';
        });
        this.#host.on('error', (data) => {
            this.#setRunning(false);
            this.#statusEl.textContent = `Error: ${data.message}`;
            this.#appendEntry({ method: 'error', args: [data.message], timestamp: performance.now() });
        });
        this.#host.on('step', (data) => {
            this.#statusEl.textContent = `Paused at line ${data.line || '?'}`;
            this.#enableResumeBtn(true);
        });

        this.#executor = new StepExecutor(this.#host);
    }

    async #run(stepping = false) {
        await this.#initHost();
        const code = this.#editor.getValue();
        if (!code.trim()) { Toast.warn('Editor is empty.'); return; }
        this.#clearOutput();
        this.#enableResumeBtn(false);

        const entry = { id: crypto.randomUUID(), code, timestamp: Date.now(), stepping };
        HistoryStore.put(entry);

        if (stepping) {
            this.#executor.stepRun(code, this.#breakpoints);
        } else {
            this.#executor.run(code);
        }
    }

    #resume() { this.#host?.resume(); this.#enableResumeBtn(false); }

    #stop() {
        this.#executor?.stop();
        this.#setRunning(false);
        this.#statusEl.textContent = 'Stopped.';
        this.#enableResumeBtn(false);
    }

    #clearOutput() {
        this.#collector.clear();
        this.#outputEl.innerHTML = '';
    }

    #setRunning(running) {
        this.#isRunning = running;
        const runBtn = this.#el.querySelector('[data-action="run"]');
        const stopBtn = this.#el.querySelector('[data-action="stop"]');
        if (runBtn) runBtn.disabled = running;
        if (stopBtn) stopBtn.disabled = !running;
    }

    #enableResumeBtn(enabled) {
        const btn = this.#el.querySelector('[data-action="resume"]');
        if (btn) btn.disabled = !enabled;
    }

    #appendEntry(entry) {
        const row = document.createElement('div');
        row.className = `console-row console-${entry.method}`;
        const time = typeof entry.timestamp === 'number' ? entry.timestamp.toFixed(1) + 'ms' : '';
        const args = (entry.args || []).join(' ');
        row.innerHTML = `
            <span class="console-time">${time}</span>
            <span class="console-badge console-badge-${entry.method}">${entry.method}</span>
            <span class="console-text">${this.#escape(args)}</span>
        `;
        this.#outputEl.appendChild(row);
        this.#outputEl.scrollTop = this.#outputEl.scrollHeight;
    }

    #renderOutput(filter) {
        this.#outputEl.innerHTML = '';
        for (const entry of this.#collector.filter(filter)) {
            this.#appendEntry(entry);
        }
    }

    #escape(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    #bindEvents() {
        this.#bus.on('session:activeFile', () => {
            const activeFile = this.#state.get('session.activeFile');
            const file = activeFile ? this.#state.get(`session.files.${activeFile}`) : null;
            if (file && ['javascript', 'typescript'].includes(file.type)) {
                this.#editor.setValue(file.content || '');
            }
        });
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
                if (this.#el.style.display !== 'none') { e.preventDefault(); this.#run(false); }
            }
        });
    }

    onActivate() {
        const activeFile = this.#state.get('session.activeFile');
        const file = activeFile ? this.#state.get(`session.files.${activeFile}`) : null;
        if (file && ['javascript', 'typescript'].includes(file.type) && !this.#editor.getValue()) {
            this.#editor.setValue(file.content || '');
        }
    }

    onDeactivate() {}

    destroy() { this.#host?.destroy(); }
}