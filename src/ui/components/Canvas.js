export class CanvasComponent {
    #canvas;
    #ctx;
    #container;
    #resizeObserver;
    #transform = { x: 0, y: 0, scale: 1 };
    #isDragging = false;
    #dragStart = { x: 0, y: 0 };
    #onRender;

    constructor(container, options = {}) {
        this.#container = container;
        this.#canvas = document.createElement('canvas');
        this.#canvas.setAttribute('role', 'img');
        this.#canvas.setAttribute('aria-label', options.ariaLabel || 'Visualization canvas');
        this.#canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:grab;';
        container.appendChild(this.#canvas);
        this.#ctx = this.#canvas.getContext('2d');
        this.#onRender = options.onRender;

        this.#resizeObserver = new ResizeObserver(() => this.#resize());
        this.#resizeObserver.observe(container);
        this.#resize();

        if (options.pannable) this.#bindPan();
        if (options.zoomable) this.#bindZoom();
    }

    get canvas() { return this.#canvas; }
    get ctx() { return this.#ctx; }
    get width() { return this.#canvas.width; }
    get height() { return this.#canvas.height; }
    get transform() { return { ...this.#transform }; }

    clear() {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    }

    applyTransform() {
        this.#ctx.setTransform(this.#transform.scale, 0, 0, this.#transform.scale, this.#transform.x, this.#transform.y);
    }

    resetTransform() {
        this.#ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.#transform.x) / this.#transform.scale,
            y: (sy - this.#transform.y) / this.#transform.scale,
        };
    }

    centerOn(x, y) {
        this.#transform.x = this.#canvas.width / 2 - x * this.#transform.scale;
        this.#transform.y = this.#canvas.height / 2 - y * this.#transform.scale;
        this.#onRender?.();
    }

    resetView() {
        this.#transform = { x: 0, y: 0, scale: 1 };
        this.#onRender?.();
    }

    #resize() {
        const rect = this.#container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.#canvas.width = rect.width * dpr;
        this.#canvas.height = rect.height * dpr;
        this.#canvas.style.width = rect.width + 'px';
        this.#canvas.style.height = rect.height + 'px';
        this.#ctx.scale(dpr, dpr);
        this.#onRender?.();
    }

    #bindPan() {
        this.#canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.#isDragging = true;
            this.#dragStart = { x: e.clientX - this.#transform.x, y: e.clientY - this.#transform.y };
            this.#canvas.style.cursor = 'grabbing';
        });
        window.addEventListener('mousemove', (e) => {
            if (!this.#isDragging) return;
            this.#transform.x = e.clientX - this.#dragStart.x;
            this.#transform.y = e.clientY - this.#dragStart.y;
            this.#onRender?.();
        });
        window.addEventListener('mouseup', () => { this.#isDragging = false; this.#canvas.style.cursor = 'grab'; });
    }

    #bindZoom() {
        this.#canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.#canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.min(Math.max(this.#transform.scale * delta, 0.1), 10);
            this.#transform.x = mx - (mx - this.#transform.x) * (newScale / this.#transform.scale);
            this.#transform.y = my - (my - this.#transform.y) * (newScale / this.#transform.scale);
            this.#transform.scale = newScale;
            this.#onRender?.();
        }, { passive: false });
    }

    destroy() {
        this.#resizeObserver.disconnect();
        this.#canvas.remove();
    }
}