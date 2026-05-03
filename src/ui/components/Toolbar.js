export class Toolbar {
    #el;
    #bus;

    constructor(container, bus) {
        this.#bus = bus;
        this.#el = container;
        this.#build();
    }

    #build() {
        this.#el.className = 'toolbar';
        this.#el.setAttribute('role', 'toolbar');
        this.#el.setAttribute('aria-label', 'DevLens main toolbar');
        this.#el.innerHTML = `
            <div class="toolbar-brand">DevLens</div>
            <div class="toolbar-actions">
                <button class="toolbar-btn" data-action="open-file" title="Open files (Ctrl+O)" aria-label="Open files">Open</button>
                <button class="toolbar-btn" data-action="re-analyze" title="Re-analyze (Ctrl+Shift+Enter)" aria-label="Re-analyze active file">Analyze</button>
                <button class="toolbar-btn" data-action="generate-report" title="Generate report (Ctrl+Shift+R)" aria-label="Generate report">Report</button>
                <button class="toolbar-btn" data-action="export-session" title="Export session" aria-label="Export session">Export</button>
            </div>
            <div class="toolbar-right">
                <button class="toolbar-btn toolbar-btn-icon" data-action="toggle-theme" title="Toggle theme (Ctrl+Shift+D)" aria-label="Toggle dark/light mode">Theme</button>
            </div>
        `;
        this.#el.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            this.#bus.emit(`toolbar:${btn.dataset.action}`, {});
        });
    }

    setActiveModule(module) {
        this.#el.querySelectorAll('[data-action]').forEach(b => b.classList.remove('active'));
    }
}