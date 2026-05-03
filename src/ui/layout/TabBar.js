export class TabBar {
    #el;
    #tabs = new Map();
    #activeId = null;
    #onSelect;

    constructor(container, options = {}) {
        this.#el = container;
        this.#el.className = 'tabbar';
        this.#el.setAttribute('role', 'tablist');
        this.#onSelect = options.onSelect;
    }

    addTab(id, label, closable = false) {
        const tab = document.createElement('button');
        tab.className = 'tabbar-tab';
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
        tab.dataset.tabId = id;
        tab.innerHTML = `<span class="tabbar-label">${label}</span>${closable ? '<span class="tabbar-close" aria-label="Close">x</span>' : ''}`;

        tab.addEventListener('click', (e) => {
            if (e.target.classList.contains('tabbar-close')) {
                this.#el.dispatchEvent(new CustomEvent('tab-close', { detail: { id }, bubbles: true }));
                return;
            }
            this.setActive(id);
            this.#onSelect?.(id);
        });

        this.#el.appendChild(tab);
        this.#tabs.set(id, tab);
        return tab;
    }

    removeTab(id) {
        const tab = this.#tabs.get(id);
        if (tab) { tab.remove(); this.#tabs.delete(id); }
        if (this.#activeId === id) {
            const first = this.#tabs.keys().next().value;
            if (first) this.setActive(first);
        }
    }

    setActive(id) {
        if (this.#activeId) {
            const prev = this.#tabs.get(this.#activeId);
            if (prev) { prev.classList.remove('active'); prev.setAttribute('aria-selected', 'false'); prev.setAttribute('tabindex', '-1'); }
        }
        this.#activeId = id;
        const tab = this.#tabs.get(id);
        if (tab) { tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); tab.setAttribute('tabindex', '0'); }
    }

    updateLabel(id, label) {
        const tab = this.#tabs.get(id);
        if (tab) tab.querySelector('.tabbar-label').textContent = label;
    }

    getActive() { return this.#activeId; }

    clear() { this.#el.innerHTML = ''; this.#tabs.clear(); this.#activeId = null; }
}