export class PanelManager {
    #panels = new Map();
    #active = null;
    #container;
    #nav;
    #bus;

    constructor(container, nav, bus) {
        this.#container = container;
        this.#nav = nav;
        this.#bus = bus;
        this.#bindKeyboard();
    }

    register(id, label, panel, shortcut = null) {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.dataset.panelId = id;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('aria-controls', `panel-${id}`);
        btn.setAttribute('tabindex', '-1');
        btn.textContent = label;
        if (shortcut) btn.title = `${label} (${shortcut})`;

        btn.addEventListener('click', () => this.activate(id));
        this.#nav.appendChild(btn);

        const el = panel.element || panel;
        el.id = `panel-${id}`;
        el.setAttribute('role', 'tabpanel');
        el.style.display = 'none';
        this.#container.appendChild(el);

        this.#panels.set(id, { id, label, panel, btn, el });
        return this;
    }

    activate(id) {
        if (this.#active === id) return;
        if (this.#active) {
            const prev = this.#panels.get(this.#active);
            if (prev) {
                prev.el.style.display = 'none';
                prev.btn.classList.remove('active');
                prev.btn.setAttribute('aria-selected', 'false');
                prev.btn.setAttribute('tabindex', '-1');
                prev.panel.onDeactivate?.();
            }
        }
        this.#active = id;
        const curr = this.#panels.get(id);
        if (curr) {
            curr.el.style.display = '';
            curr.btn.classList.add('active');
            curr.btn.setAttribute('aria-selected', 'true');
            curr.btn.setAttribute('tabindex', '0');
            curr.panel.onActivate?.();
            this.#bus.emit('panel:activated', { id });
        }
    }

    getActive() { return this.#active; }

    getPanel(id) { return this.#panels.get(id)?.panel; }

    #bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                e.preventDefault();
                const ids = [...this.#panels.keys()];
                if (ids[num - 1]) this.activate(ids[num - 1]);
            }
        });
    }
}