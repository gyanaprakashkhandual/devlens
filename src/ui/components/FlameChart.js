import { CanvasComponent } from './Canvas.js';

export class FlameChart {
    #canvas;
    #data = { frames: [], totalDuration: 0 };
    #scrollX = 0;
    #zoom = 1;
    #hoveredFrame = null;
    #tooltip;
    #container;

    constructor(container) {
        this.#container = container;
        this.#canvas = new CanvasComponent(container, {
            ariaLabel: 'Flame chart showing function call durations',
            zoomable: false,
            pannable: false,
            onRender: () => this.#render(),
        });
        this.#buildTooltip();
        this.#bindInteractions();
    }

    setData(data) {
        this.#data = data;
        this.#scrollX = 0;
        this.#zoom = 1;
        this.#render();
    }

    #buildTooltip() {
        this.#tooltip = document.createElement('div');
        this.#tooltip.className = 'flame-tooltip';
        this.#tooltip.style.cssText = 'position:absolute;display:none;pointer-events:none;z-index:100;';
        this.#container.style.position = 'relative';
        this.#container.appendChild(this.#tooltip);
    }

    #bindInteractions() {
        const cvs = this.#canvas.canvas;
        cvs.addEventListener('mousemove', (e) => {
            const rect = cvs.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.#hoveredFrame = this.#hitTest(x, y);
            this.#render();
            if (this.#hoveredFrame) {
                this.#tooltip.style.display = 'block';
                this.#tooltip.style.left = (x + 12) + 'px';
                this.#tooltip.style.top = (y + 12) + 'px';
                this.#tooltip.textContent = `${this.#hoveredFrame.name} — ${this.#hoveredFrame.duration.toFixed(2)}ms`;
            } else {
                this.#tooltip.style.display = 'none';
            }
        });
        cvs.addEventListener('mouseleave', () => { this.#hoveredFrame = null; this.#tooltip.style.display = 'none'; this.#render(); });
        cvs.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.#zoom = Math.min(Math.max(this.#zoom * delta, 0.5), 20);
            this.#render();
        }, { passive: false });
    }

    #hitTest(mx, my) {
        const rowH = 24;
        const w = this.#canvas.width;
        const timeScale = (w / Math.max(this.#data.totalDuration, 1)) * this.#zoom;
        for (const f of this.#data.frames) {
            const x = (f.start - this.#scrollX) * timeScale;
            const fw = Math.max(f.duration * timeScale - 1, 2);
            const y = f.depth * rowH;
            if (mx >= x && mx <= x + fw && my >= y && my <= y + rowH) return f;
        }
        return null;
    }

    #render() {
        const ctx = this.#canvas.ctx;
        const w = this.#canvas.width;
        const h = this.#canvas.height;
        const rowH = 24;
        const timeScale = (w / Math.max(this.#data.totalDuration, 1)) * this.#zoom;

        ctx.clearRect(0, 0, w, h);

        if (!this.#data.frames.length) {
            ctx.fillStyle = 'var(--color-text-tertiary, #666)';
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('No profiling data. Run code to profile.', w / 2, h / 2);
            ctx.textAlign = 'left';
            return;
        }

        for (const f of this.#data.frames) {
            const x = (f.start - this.#scrollX) * timeScale;
            const fw = Math.max(f.duration * timeScale - 1, 2);
            const y = f.depth * rowH;
            if (x + fw < 0 || x > w) continue;

            const isHovered = f === this.#hoveredFrame;
            ctx.fillStyle = isHovered ? '#fff' : (f.color || '#5c9ee0');
            ctx.fillRect(x, y, fw, rowH - 2);

            if (isHovered) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y, fw, rowH - 2);
            }

            if (fw > 30) {
                ctx.fillStyle = isHovered ? '#000' : '#fff';
                ctx.font = '11px monospace';
                ctx.save();
                ctx.rect(x, y, fw, rowH - 2);
                ctx.clip();
                ctx.fillText(f.name, x + 4, y + 15);
                ctx.restore();
            }
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < h; i += rowH) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
        }
    }
}