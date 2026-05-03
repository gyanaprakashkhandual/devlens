import { CanvasComponent } from '../components/Canvas.js';
import { ForceSimulation } from '../../engines/dependency/ForceSimulation.js';
import { Toast } from '../components/Toast.js';

export class DependencyPanel {
    #el;
    #bus;
    #state;
    #worker = null;
    #canvas;
    #sim = null;
    #nodes = [];
    #edges = [];
    #cycles = [];
    #hoveredNode = null;
    #infoEl;

    constructor(bus, state) {
        this.#bus = bus;
        this.#state = state;
        this.#el = document.createElement('div');
        this.#el.className = 'panel dependency-panel';
        this.#build();
        this.#spawnWorker();
    }

    get element() { return this.#el; }

    #build() {
        this.#el.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">Dependency Graph</h2>
                <button class="run-btn" aria-label="Build dependency graph">Build Graph</button>
                <button class="reset-btn" aria-label="Reset view">Reset View</button>
            </div>
            <div class="dep-info" aria-live="polite"></div>
            <div class="dep-canvas-container" style="flex:1;position:relative;min-height:300px;"></div>
        `;
        this.#infoEl = this.#el.querySelector('.dep-info');
        const container = this.#el.querySelector('.dep-canvas-container');
        this.#canvas = new CanvasComponent(container, {
            ariaLabel: 'Module dependency graph',
            pannable: true,
            zoomable: true,
            onRender: () => this.#render(),
        });
        this.#el.querySelector('.run-btn').addEventListener('click', () => this.#run());
        this.#el.querySelector('.reset-btn').addEventListener('click', () => this.#canvas.resetView());
        this.#canvas.canvas.addEventListener('mousemove', (e) => this.#onHover(e));
    }

    #spawnWorker() {
        try {
            this.#worker = new Worker('./src/engines/dependency/dependency.worker.js', { type: 'module' });
            this.#worker.onmessage = (e) => this.#onResult(e.data);
        } catch { Toast.warn('Dependency worker unavailable.'); }
    }

    #run() {
        const files = this.#state.get('session.files') || {};
        const jsFiles = Object.fromEntries(
            Object.entries(files)
                .filter(([, f]) => ['javascript', 'typescript'].includes(f.type))
                .map(([k, f]) => [k, f.content])
        );
        if (!Object.keys(jsFiles).length) { Toast.warn('No JavaScript files loaded.'); return; }
        this.#worker?.postMessage({ id: 'dep', files: jsFiles });
        this.#infoEl.textContent = 'Building graph...';
    }

    #onResult(data) {
        if (data.error) { Toast.error(`Dependency error: ${data.error}`); return; }
        this.#cycles = data.cycles || [];
        const cycleNodeIds = new Set(this.#cycles.flat());
        this.#nodes = (data.nodes || []).map(n => ({ ...n, inCycle: cycleNodeIds.has(n.id) }));
        this.#edges = data.edges || [];

        if (this.#cycles.length) Toast.warn(`${this.#cycles.length} circular dependency cycle(s) detected.`);

        const w = this.#canvas.width;
        const h = this.#canvas.height;
        this.#sim = new ForceSimulation(this.#nodes, this.#edges, w, h, (nodes, edges) => {
            this.#nodes = nodes;
            this.#edges = edges;
            this.#render();
        });
        this.#sim.start();
        this.#infoEl.textContent = `${this.#nodes.length} modules, ${this.#edges.length} dependencies${this.#cycles.length ? `, ${this.#cycles.length} cycle(s)` : ''}.`;
    }

    #render() {
        const ctx = this.#canvas.ctx;
        const w = this.#canvas.width;
        const h = this.#canvas.height;
        ctx.clearRect(0, 0, w, h);

        if (!this.#nodes.length) {
            ctx.fillStyle = 'var(--color-text-tertiary, #666)';
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Build dependency graph to visualize module relationships.', w / 2, h / 2);
            ctx.textAlign = 'left';
            return;
        }

        this.#canvas.applyTransform();

        for (const edge of this.#edges) {
            const from = this.#nodes.find(n => n.id === edge.from);
            const to = this.#nodes.find(n => n.id === edge.to);
            if (!from || !to) continue;
            const isCyclic = this.#cycles.some(c => c.includes(edge.from) && c.includes(edge.to));
            ctx.strokeStyle = isCyclic ? '#e05c5c' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isCyclic ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();

            const angle = Math.atan2(to.y - from.y, to.x - from.x);
            const arrowX = to.x - Math.cos(angle) * 18;
            const arrowY = to.y - Math.sin(angle) * 18;
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 8 * Math.cos(angle - 0.4), arrowY - 8 * Math.sin(angle - 0.4));
            ctx.lineTo(arrowX - 8 * Math.cos(angle + 0.4), arrowY - 8 * Math.sin(angle + 0.4));
            ctx.closePath();
            ctx.fillStyle = isCyclic ? '#e05c5c' : 'rgba(255,255,255,0.3)';
            ctx.fill();
        }

        for (const node of this.#nodes) {
            const r = 14 + Math.min(node.imports || 0, 6) * 2;
            const isHovered = node === this.#hoveredNode;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
            ctx.fillStyle = node.inCycle ? '#8b2020' : isHovered ? '#4a7ec0' : '#2a4a6c';
            ctx.fill();
            ctx.strokeStyle = node.inCycle ? '#e05c5c' : isHovered ? '#6a9ee0' : 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            const label = node.name.split('/').pop();
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, node.x, node.y + r + 12);
            ctx.textAlign = 'left';
        }

        this.#canvas.resetTransform();
    }

    #onHover(e) {
        const rect = this.#canvas.canvas.getBoundingClientRect();
        const wx = e.clientX - rect.left;
        const wy = e.clientY - rect.top;
        const world = this.#canvas.screenToWorld(wx, wy);
        let found = null;
        for (const node of this.#nodes) {
            const dx = world.x - node.x;
            const dy = world.y - node.y;
            if (Math.sqrt(dx * dx + dy * dy) < 20) { found = node; break; }
        }
        if (found !== this.#hoveredNode) { this.#hoveredNode = found; this.#render(); }
    }

    onActivate() { this.#render(); }
    onDeactivate() {}
}