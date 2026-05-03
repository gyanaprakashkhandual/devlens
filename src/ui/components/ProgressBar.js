export class ProgressBar {
    #el;
    #fill;
    #label;
    #value = 0;

    constructor(container, options = {}) {
        this.#el = document.createElement('div');
        this.#el.className = 'progress-bar';
        this.#el.setAttribute('role', 'progressbar');
        this.#el.setAttribute('aria-valuemin', '0');
        this.#el.setAttribute('aria-valuemax', '100');
        this.#el.setAttribute('aria-valuenow', '0');
        if (options.label) this.#el.setAttribute('aria-label', options.label);

        this.#fill = document.createElement('div');
        this.#fill.className = 'progress-fill';

        this.#label = document.createElement('span');
        this.#label.className = 'progress-label';

        this.#el.appendChild(this.#fill);
        this.#el.appendChild(this.#label);
        container.appendChild(this.#el);
    }

    set(value, text) {
        this.#value = Math.min(Math.max(value, 0), 100);
        this.#fill.style.width = `${this.#value}%`;
        this.#el.setAttribute('aria-valuenow', String(this.#value));
        if (text !== undefined) this.#label.textContent = text;
    }

    setIndeterminate(on) {
        this.#el.classList.toggle('indeterminate', on);
        if (on) this.#el.removeAttribute('aria-valuenow');
        else this.#el.setAttribute('aria-valuenow', String(this.#value));
    }

    show() { this.#el.style.display = ''; }
    hide() { this.#el.style.display = 'none'; }

    complete(text = 'Done') {
        this.set(100, text);
        setTimeout(() => this.hide(), 800);
    }

    get element() { return this.#el; }
}