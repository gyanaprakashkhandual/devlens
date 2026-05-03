export class Modal {
    #overlay;
    #dialog;
    #onClose;

    static show({ title, content, actions = [], onClose } = {}) {
        const modal = new Modal();
        modal.#onClose = onClose;
        modal.#render(title, content, actions);
        return modal;
    }

    static confirm(message, onConfirm, onCancel) {
        return Modal.show({
            title: 'Confirm',
            content: `<p>${message}</p>`,
            actions: [
                { label: 'Cancel', variant: 'secondary', onClick: (m) => { onCancel?.(); m.close(); } },
                { label: 'Confirm', variant: 'primary', onClick: (m) => { onConfirm?.(); m.close(); } },
            ],
        });
    }

    #render(title, content, actions) {
        this.#overlay = document.createElement('div');
        this.#overlay.className = 'modal-overlay';
        this.#overlay.setAttribute('role', 'dialog');
        this.#overlay.setAttribute('aria-modal', 'true');
        this.#overlay.setAttribute('aria-label', title || 'Dialog');

        this.#dialog = document.createElement('div');
        this.#dialog.className = 'modal-dialog';
        this.#dialog.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${title || ''}</h2>
                <button class="modal-close" aria-label="Close dialog">x</button>
            </div>
            <div class="modal-body">${typeof content === 'string' ? content : ''}</div>
            <div class="modal-footer"></div>
        `;

        if (content instanceof HTMLElement) this.#dialog.querySelector('.modal-body').appendChild(content);

        const footer = this.#dialog.querySelector('.modal-footer');
        for (const action of actions) {
            const btn = document.createElement('button');
            btn.className = `modal-action-btn modal-action-${action.variant || 'secondary'}`;
            btn.textContent = action.label;
            btn.addEventListener('click', () => action.onClick?.(this));
            footer.appendChild(btn);
        }

        this.#dialog.querySelector('.modal-close').addEventListener('click', () => this.close());
        this.#overlay.addEventListener('click', (e) => { if (e.target === this.#overlay) this.close(); });
        document.addEventListener('keydown', this.#onKeydown.bind(this));

        this.#overlay.appendChild(this.#dialog);
        document.body.appendChild(this.#overlay);
        requestAnimationFrame(() => this.#overlay.classList.add('visible'));
        this.#dialog.querySelector('button')?.focus();
    }

    close() {
        this.#overlay.classList.remove('visible');
        document.removeEventListener('keydown', this.#onKeydown.bind(this));
        setTimeout(() => this.#overlay.remove(), 200);
        this.#onClose?.();
    }

    #onKeydown(e) { if (e.key === 'Escape') this.close(); }
}