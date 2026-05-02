import { Quadtree } from './Quadtree.js';

const REPULSION = 8000;
const SPRING_K = 0.08;
const SPRING_REST = 120;
const GRAVITY = 0.05;
const DAMPING = 0.85;
const THETA = 0.9;
const ENERGY_THRESHOLD = 0.01;
const MAX_TICKS = 500;

export class ForceSimulation {
    #nodes = [];
    #edges = [];
    #width = 800;
    #height = 600;
    #running = false;
    #tick = 0;
    #onTick;

    constructor(nodes, edges, width, height, onTick) {
        this.#width = width;
        this.#height = height;
        this.#onTick = onTick;
        this.#nodes = nodes.map(n => ({
            ...n,
            x: width / 2 + (Math.random() - 0.5) * 300,
            y: height / 2 + (Math.random() - 0.5) * 300,
            vx: 0, vy: 0,
            mass: 1 + (n.imports || 0) * 0.3,
            pinned: false,
        }));
        this.#edges = edges;
    }

    start() {
        this.#running = true;
        this.#tick = 0;
        this.#loop();
    }

    stop() { this.#running = false; }

    pinNode(id, x, y) {
        const n = this.#nodes.find(n => n.id === id);
        if (n) { n.x = x; n.y = y; n.vx = 0; n.vy = 0; n.pinned = true; }
    }

    unpinNode(id) {
        const n = this.#nodes.find(n => n.id === id);
        if (n) n.pinned = false;
    }

    getNodes() { return this.#nodes; }
    getEdges() { return this.#edges; }

    #loop() {
        if (!this.#running || this.#tick >= MAX_TICKS) { this.#running = false; return; }
        const energy = this.#step();
        this.#onTick(this.#nodes, this.#edges);
        this.#tick++;
        if (energy < ENERGY_THRESHOLD) { this.#running = false; this.#onTick(this.#nodes, this.#edges); return; }
        setTimeout(() => this.#loop(), 16);
    }

    #step() {
        const cx = this.#width / 2, cy = this.#height / 2;
        const tree = new Quadtree(0, 0, this.#width, this.#height);
        for (const n of this.#nodes) tree.insert(n);

        let totalEnergy = 0;

        for (const n of this.#nodes) {
            if (n.pinned) continue;
            const rep = tree.computeForce(n, THETA, REPULSION);
            let fx = rep.fx + (cx - n.x) * GRAVITY;
            let fy = rep.fy + (cy - n.y) * GRAVITY;

            for (const e of this.#edges) {
                let other = null;
                if (e.from === n.id) other = this.#nodes.find(nd => nd.id === e.to);
                else if (e.to === n.id) other = this.#nodes.find(nd => nd.id === e.from);
                if (!other) continue;
                const dx = other.x - n.x, dy = other.y - n.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
                const stretch = dist - SPRING_REST;
                const f = SPRING_K * stretch;
                fx += f * dx / dist;
                fy += f * dy / dist;
            }

            n.vx = (n.vx + fx) * DAMPING;
            n.vy = (n.vy + fy) * DAMPING;
            n.x = Math.max(40, Math.min(this.#width - 40, n.x + n.vx));
            n.y = Math.max(40, Math.min(this.#height - 40, n.y + n.vy));
            totalEnergy += Math.abs(n.vx) + Math.abs(n.vy);
        }
        return totalEnergy / this.#nodes.length;
    }
}