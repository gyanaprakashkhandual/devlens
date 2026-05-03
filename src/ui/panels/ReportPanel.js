import { ReportGenerator } from '../../report/ReportGenerator.js';
import { Toast } from '../components/Toast.js';

export class ReportPanel {
    #el;
    #bus;
    #state;
    #generator;
    #previewEl;

    constructor(bus, state) {
        this.#bus = bus;
        this.#state = state;
        this.#generator = new ReportGenerator(state, bus);
        this.#el = document.createElement('div');
        this.#el.className = 'panel report-panel';
        this.#build();
        this.#bindEvents();
    }

    get element() { return this.#el; }

    #build() {
        this.#el.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">Report Generator</h2>
                <div class="report-actions">
                    <button class="run-btn" data-action="preview" aria-label="Preview report">Preview</button>
                    <button class="run-btn" data-action="download" aria-label="Download report">Download</button>
                </div>
            </div>
            <div class="report-options">
                <fieldset class="report-modules">
                    <legend>Include modules</legend>
                    <label><input type="checkbox" value="analysis" checked> Static Analysis</label>
                    <label><input type="checkbox" value="accessibility" checked> Accessibility</label>
                    <label><input type="checkbox" value="memory" checked> Memory Leaks</label>
                    <label><input type="checkbox" value="dependency" checked> Dependencies</label>
                </fieldset>
                <div class="report-files">
                    <strong>Files to include:</strong>
                    <div class="report-file-list" role="group" aria-label="File selection"></div>
                </div>
            </div>
            <div class="report-preview" style="flex:1;overflow:hidden;border-top:1px solid var(--color-border-tertiary);margin-top:1rem;"></div>
        `;

        this.#previewEl = this.#el.querySelector('.report-preview');

        this.#el.querySelector('.report-actions').addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'download') this.#generate(false);
            if (action === 'preview') this.#generate(true);
        });
    }

    #bindEvents() {
        this.#state.subscribe('session.files', () => this.#syncFileList());
        this.#bus.on('session:restored', () => this.#syncFileList());
        this.#bus.on('toolbar:generate-report', () => this.#generate(false));
    }

    #syncFileList() {
        const files = this.#state.get('session.files') || {};
        const container = this.#el.querySelector('.report-file-list');
        container.innerHTML = '';
        for (const name of Object.keys(files)) {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${name}" checked> ${name}`;
            container.appendChild(label);
        }
        if (!Object.keys(files).length) {
            container.innerHTML = '<span class="empty-state">No files loaded.</span>';
        }
    }

    #getSelectedModules() {
        return [...this.#el.querySelectorAll('.report-modules input:checked')].map(i => i.value);
    }

    #getSelectedFiles() {
        return [...this.#el.querySelectorAll('.report-file-list input:checked')].map(i => i.value);
    }

    #generate(preview) {
        const files = this.#state.get('session.files') || {};
        if (!Object.keys(files).length) {
            Toast.warn('No files loaded. Load files before generating a report.');
            return;
        }
        const modules = this.#getSelectedModules();
        const fileNames = this.#getSelectedFiles();
        if (!fileNames.length) { Toast.warn('Select at least one file to include.'); return; }

        if (preview) {
            this.#generator.preview(this.#previewEl);
            Toast.info('Report preview generated.');
        } else {
            this.#generator.generate({ modules, fileNames });
            Toast.success('Report downloaded.');
        }
    }

    onActivate() { this.#syncFileList(); }
    onDeactivate() {}
}