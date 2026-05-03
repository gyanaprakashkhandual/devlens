import { CodeEditor } from '../components/CodeEditor.js';
import { SplitView } from '../layout/SplitView.js';
import { FileTab } from '../components/FileTab.js';

export class EditorPanel {
    #el;
    #bus;
    #state;
    #editor;
    #tabBar;
    #activeFile = null;

    constructor(bus, state) {
        this.#bus = bus;
        this.#state = state;
        this.#el = document.createElement('div');
        this.#el.className = 'panel editor-panel';
        this.#build();
        this.#bindEvents();
    }

    get element() { return this.#el; }

    #build() {
        this.#el.innerHTML = `
            <div class="editor-tab-bar" role="tablist" aria-label="Open files"></div>
            <div class="editor-area"></div>
        `;
        this.#tabBar = this.#el.querySelector('.editor-tab-bar');
        const editorArea = this.#el.querySelector('.editor-area');
        this.#editor = new CodeEditor(editorArea, {
            onChange: (value) => {
                if (this.#activeFile) {
                    this.#state.set(`session.files.${this.#activeFile}.content`, value);
                    this.#bus.emit('editor:change', { name: this.#activeFile, content: value });
                }
            },
            onBreakpointToggle: (bps) => {
                this.#bus.emit('editor:breakpoints', { breakpoints: bps });
            },
        });
    }

    #bindEvents() {
        this.#bus.on('ingestion:file-ready', () => this.#syncTabs());
        this.#bus.on('session:restored', () => this.#syncTabs());
        this.#state.subscribe('session.files', () => this.#syncTabs());
        this.#state.subscribe('session.activeFile', (name) => { if (name) this.#openFile(name); });
    }

    #syncTabs() {
        const files = this.#state.get('session.files') || {};
        FileTab.renderList(files, this.#activeFile, this.#tabBar,
            (name) => { this.#state.set('session.activeFile', name); },
            (name) => { this.#bus.emit('editor:close-file', { name }); }
        );
        if (!this.#activeFile) {
            const first = Object.keys(files)[0];
            if (first) this.#openFile(first);
        }
    }

    #openFile(name) {
        const file = this.#state.get(`session.files.${name}`);
        if (!file) return;
        this.#activeFile = name;
        this.#editor.setValue(file.content || '');
        this.#syncTabs();
    }

    jumpToLine(line) { this.#editor.jumpToLine(line); }

    onActivate() {}
    onDeactivate() {}
}