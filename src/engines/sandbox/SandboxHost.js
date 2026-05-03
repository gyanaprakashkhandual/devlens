export class SandboxHost {
    #iframe = null;
    #listeners = new Map();
    #ready = false;
    #queue = [];
    #bus;

    constructor(bus) {
        this.#bus = bus;
    }

    mount(container) {
        if (this.#iframe) this.#iframe.remove();
        this.#iframe = document.createElement('iframe');
        this.#iframe.setAttribute('sandbox', 'allow-scripts');
        this.#iframe.setAttribute('title', 'DevLens sandbox execution context');
        this.#iframe.src = './sandbox/sandbox.html';
        this.#iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
        container.appendChild(this.#iframe);

        window.addEventListener('message', this.#onMessage.bind(this));
        return new Promise(resolve => {
            const unsub = this.on('ready', () => { this.#ready = true; unsub(); resolve(); this.#flushQueue(); });
        });
    }

    send(type, data = {}) {
        if (!this.#ready) { this.#queue.push({ type, data }); return; }
        this.#iframe?.contentWindow?.postMessage({ source: 'devlens-parent', type, ...data }, '*');
    }

    on(event, handler) {
        if (!this.#listeners.has(event)) this.#listeners.set(event, []);
        this.#listeners.get(event).push(handler);
        return () => {
            const list = this.#listeners.get(event);
            if (list) { const i = list.indexOf(handler); if (i !== -1) list.splice(i, 1); }
        };
    }

    run(code) { this.send('run', { code }); }
    stepRun(code, breakpoints = []) { this.send('step-run', { code, breakpoints }); }
    resume() { this.send('resume'); }
    setBreakpoints(lines) { this.send('set-breakpoints', { breakpoints: lines }); }

    destroy() {
        window.removeEventListener('message', this.#onMessage.bind(this));
        this.#iframe?.remove();
        this.#iframe = null;
        this.#ready = false;
        this.#queue = [];
    }

    #onMessage(e) {
        if (!e.data || e.data.source !== 'devlens-sandbox') return;
        const { type, data } = e.data;
        const handlers = this.#listeners.get(type) || [];
        for (const h of handlers) h(data);
        this.#bus.emit(`sandbox:${type}`, data);
    }

    #flushQueue() {
        for (const msg of this.#queue) this.send(msg.type, msg.data);
        this.#queue = [];
    }
}