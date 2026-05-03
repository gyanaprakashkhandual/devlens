import { CanvasComponent } from '../components/Canvas.js';

export class ScopePanel {
    #el;
    #bus;
    #state;
    #canvas;
    #scopeTree = null;
    #descEl;

    constructor(bus, state) {
        this.#bus = bus;
        this.#state = state;
        this.#el = document.createElement('div');
        this.#el.className = 'panel scope-panel';
        this.#build();
        this.#bindEvents();
    }

    get element() { return this.#el; }

    #build() {
        this.#el.innerHTML = `
            <div class="panel-header"><h2 class="panel-title">Scope & Closure Visualizer</h2></div>
            <div class="scope-description" aria-live="polite"></div>
            <div class="scope-canvas-container"></div>
        `;
        this.#descEl = this.#el.querySelector('.scope-description');
        const container = this.#el.querySelector('.scope-canvas-container');
        container.style.cssText = 'flex:1;position:relative;min-height:300px;';
        this.#canvas = new CanvasComponent(container, {
            ariaLabel: 'Scope chain diagram showing variable scopes and closures',
            pannable: true,
            zoomable: true,
            onRender: () => this.#render(),
        });
    }

    #bindEvents() {
        this.#bus.on('analysis:scope-ready', (data) => {
            this.#scopeTree = data.scopeTree;
            this.#render();
        });
    }

    #render() {
        const ctx = this.#canvas.ctx;
        const w = this.#canvas.width;
        const h = this.#canvas.height;
        ctx.clearRect(0, 0, w, h);

        if (!this.#scopeTree) {
            ctx.fillStyle = 'var(--color-text-tertiary, #666)';
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Run analysis on a JavaScript file to see scope tree.', w / 2, h / 2);
            ctx.textAlign = 'left';
            this.#descEl.textContent = 'No scope data. Analyze a JavaScript file first.';
            return;
        }

        this.#canvas.applyTransform();
        this.#drawScope(ctx, this.#scopeTree, 20, 20, Math.min(w - 40, 800), 0);
        this.#canvas.resetTransform();

        this.#descEl.textContent = `Scope tree for ${this.#state.get('session.activeFile') || 'current file'}. ${this.#countScopes(this.#scopeTree)} scopes detected.`;
    }

    #drawScope(ctx, scope, x, y, width, depth) {
        const rowH = 22;
        const padding = 16;
        const vars = scope.variables || [];
        const children = scope.children || [];
        const innerH = Math.max(vars.length * rowH + padding * 2, 60);
        const totalChildH = children.reduce((sum, c) => sum + this.#estimateHeight(c), 0);
        const height = innerH + totalChildH + (children.length ? padding : 0);

        const colors = ['#1e3a5f', '#1a4a3a', '#3d2a1a', '#2d1a3d', '#1a2d3d'];
        ctx.fillStyle = colors[depth % colors.length];
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        this.#roundRect(ctx, x, y, width, height, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `bold 11px monospace`;
        ctx.fillText(`${scope.type}: ${scope.name}`, x + 10, y + 16);

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '11px monospace';
        for (let i = 0; i < vars.length; i++) {
            const v = vars[i];
            ctx.fillText(`${v.kind} ${v.name}`, x + 20, y + padding + 16 + i * rowH);
        }

        let childY = y + innerH;
        const childW = Math.max((width - padding * 2 - (children.length - 1) * 8) / Math.max(children.length, 1), 80);
        for (let i = 0; i < children.length; i++) {
            const childX = x + padding + i * (childW + 8);
            this.#drawScope(ctx, children[i], childX, childY, childW, depth + 1);
        }
    }

    #estimateHeight(scope) {
        const vars = scope.variables || [];
        const base = Math.max(vars.length * 22 + 32, 60);
        const childH = (scope.children || []).reduce((s, c) => s + this.#estimateHeight(c), 0);
        return base + childH;
    }

    #countScopes(scope) {
        return 1 + (scope.children || []).reduce((s, c) => s + this.#countScopes(c), 0);
    }

    #roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    onActivate() { this.#render(); }
    onDeactivate() {}
}