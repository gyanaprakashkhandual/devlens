import { SyntaxHighlighter } from './SyntaxHighlighter.js';
import { StringSearch } from '../utils/StringSearch.js';
import { debounce } from '../utils/Debounce.js';

export class CodeEditor {
    #container;
    #textarea;
    #highlight;
    #lineNumbers;
    #highlighter = new SyntaxHighlighter();
    #value = '';
    #onChange;
    #breakpoints = new Set();
    #onBreakpointToggle;
    #tabSize = 2;
    #searchBar = null;

    constructor(container, options = {}) {
        this.#container = container;
        this.#tabSize = options.tabSize ?? 2;
        this.#onChange = options.onChange;
        this.#onBreakpointToggle = options.onBreakpointToggle;
        this.#build();
    }

    #build() {
        this.#container.classList.add('code-editor');
        this.#container.innerHTML = `
            <div class="editor-gutter" aria-hidden="true"></div>
            <div class="editor-scroll-area">
                <div class="editor-highlight" aria-hidden="true"></div>
                <textarea class="editor-textarea" spellcheck="false" autocorrect="off" autocapitalize="off" autocomplete="off"></textarea>
            </div>
        `;
        this.#lineNumbers = this.#container.querySelector('.editor-gutter');
        this.#highlight = this.#container.querySelector('.editor-highlight');
        this.#textarea = this.#container.querySelector('.editor-textarea');

        this.#textarea.addEventListener('input', debounce(() => {
            this.#value = this.#textarea.value;
            this.#render();
            this.#onChange?.(this.#value);
        }, 120));

        this.#textarea.addEventListener('keydown', (e) => this.#handleKey(e));
        this.#textarea.addEventListener('scroll', () => this.#syncScroll());
        this.#lineNumbers.addEventListener('click', (e) => this.#handleGutterClick(e));
    }

    #handleKey(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const { selectionStart: s, selectionEnd: end, value } = this.#textarea;
            const spaces = ' '.repeat(this.#tabSize);
            this.#textarea.value = value.slice(0, s) + spaces + value.slice(end);
            this.#textarea.selectionStart = this.#textarea.selectionEnd = s + this.#tabSize;
            this.#value = this.#textarea.value;
            this.#render();
            this.#onChange?.(this.#value);
        }
        if (e.key === 'f' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.#openSearch(); }
    }

    #handleGutterClick(e) {
        const lineEl = e.target.closest('[data-line]');
        if (!lineEl) return;
        const line = parseInt(lineEl.dataset.line);
        if (this.#breakpoints.has(line)) this.#breakpoints.delete(line);
        else this.#breakpoints.add(line);
        this.#renderGutter();
        this.#onBreakpointToggle?.([...this.#breakpoints]);
    }

    #render() {
        this.#highlight.innerHTML = this.#highlighter.highlightLines(this.#value);
        this.#renderGutter();
    }

    #renderGutter() {
        const lines = (this.#value || '').split('\n');
        this.#lineNumbers.innerHTML = lines.map((_, i) => {
            const n = i + 1;
            const bp = this.#breakpoints.has(n);
            return `<div class="gutter-line${bp ? ' has-breakpoint' : ''}" data-line="${n}">${n}</div>`;
        }).join('');
    }

    #syncScroll() {
        const s = this.#textarea;
        this.#highlight.parentElement.scrollTop = s.scrollTop;
        this.#lineNumbers.scrollTop = s.scrollTop;
    }

    #openSearch() {
        if (this.#searchBar) { this.#searchBar.querySelector('input')?.focus(); return; }
        this.#searchBar = document.createElement('div');
        this.#searchBar.className = 'editor-search-bar';
        this.#searchBar.innerHTML = `
            <input type="text" placeholder="Find..." />
            <input type="text" placeholder="Replace..." />
            <button data-action="find-prev">Prev</button>
            <button data-action="find-next">Next</button>
            <button data-action="replace-one">Replace</button>
            <button data-action="replace-all">All</button>
            <button data-action="close">x</button>
        `;
        this.#container.appendChild(this.#searchBar);
        this.#searchBar.querySelector('input').focus();
        this.#searchBar.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'close') { this.#searchBar.remove(); this.#searchBar = null; }
            if (action === 'replace-all') this.#replaceAll();
        });
    }

    #replaceAll() {
        if (!this.#searchBar) return;
        const [findInput, replaceInput] = this.#searchBar.querySelectorAll('input');
        const pattern = findInput.value;
        const replacement = replaceInput.value;
        if (!pattern) return;
        const searcher = new StringSearch(pattern, false);
        this.setValue(searcher.replace(this.#value, replacement));
        this.#onChange?.(this.#value);
    }

    setValue(code) {
        this.#value = code;
        this.#textarea.value = code;
        this.#render();
    }

    getValue() { return this.#value; }

    jumpToLine(line) {
        const lines = this.#value.split('\n');
        const pos = lines.slice(0, line - 1).reduce((s, l) => s + l.length + 1, 0);
        this.#textarea.setSelectionRange(pos, pos);
        this.#textarea.focus();
        const lineH = 20;
        this.#textarea.scrollTop = (line - 1) * lineH - 100;
        this.#syncScroll();
    }

    setTabSize(n) { this.#tabSize = n; }

    getBreakpoints() { return [...this.#breakpoints]; }

    focus() { this.#textarea.focus(); }
}