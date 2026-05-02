export class SandboxProfiler {
    #iframe = null;
    #bus;
    #results = { marks: [], measures: [], longTasks: [], frameTimes: [], callLog: [] };

    constructor(bus) {
        this.#bus = bus;
    }

    createSandbox() {
        if (this.#iframe) this.#iframe.remove();
        this.#iframe = document.createElement('iframe');
        this.#iframe.setAttribute('sandbox', 'allow-scripts');
        this.#iframe.style.display = 'none';
        document.body.appendChild(this.#iframe);
        return this.#iframe;
    }

    async profile(code) {
        this.#results = { marks: [], measures: [], longTasks: [], frameTimes: [], callLog: [] };
        const iframe = this.createSandbox();

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.cleanup();
                resolve(this.#results);
            }, 5000);

            window.addEventListener('message', (e) => {
                if (!e.data || e.data.source !== 'devlens-sandbox') return;
                if (e.data.type === 'profile-result') {
                    clearTimeout(timeout);
                    Object.assign(this.#results, e.data.data);
                    this.cleanup();
                    resolve(this.#results);
                }
            }, { once: true });

            const wrappedCode = `
                const __marks = [];
                const __startTime = performance.now();
                try {
                    ${code}
                } catch(e) {}
                const __duration = performance.now() - __startTime;
                window.parent.postMessage({ source: 'devlens-sandbox', type: 'profile-result', data: { duration: __duration, marks: __marks } }, '*');
            `;

            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(`<!doctype html><html><body><script>${wrappedCode}<\/script></body></html>`);
            doc.close();
        });
    }

    cleanup() {
        if (this.#iframe) { this.#iframe.remove(); this.#iframe = null; }
    }
}