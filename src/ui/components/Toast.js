let container = null;

function getContainer() {
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.setAttribute('role', 'log');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(container);
    }
    return container;
}

export class Toast {
    static show(message, type = 'info', duration = 4000) {
        const c = getContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.innerHTML = `<span class="toast-message">${message}</span><button class="toast-close" aria-label="Dismiss">x</button>`;

        toast.querySelector('.toast-close').addEventListener('click', () => Toast.#dismiss(toast));
        c.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('visible'));

        if (duration > 0) setTimeout(() => Toast.#dismiss(toast), duration);
        return toast;
    }

    static success(msg, duration) { return Toast.show(msg, 'success', duration); }
    static error(msg, duration)   { return Toast.show(msg, 'error', duration); }
    static warn(msg, duration)    { return Toast.show(msg, 'warn', duration); }
    static info(msg, duration)    { return Toast.show(msg, 'info', duration); }

    static #dismiss(toast) {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }
}