export class Quadtree {
    #x; #y; #w; #h;
    #node = null;
    #mass = 0;
    #cx = 0; #cy = 0;
    #children = null;

    constructor(x, y, w, h) {
        this.#x = x; this.#y = y; this.#w = w; this.#h = h;
    }

    insert(node) {
        if (this.#children) {
            this.#getQuadrant(node.x, node.y)?.insert(node);
            this.#mass += node.mass;
            this.#cx = (this.#cx * (this.#mass - node.mass) + node.x * node.mass) / this.#mass;
            this.#cy = (this.#cy * (this.#mass - node.mass) + node.y * node.mass) / this.#mass;
            return;
        }
        if (!this.#node) {
            this.#node = node;
            this.#mass = node.mass;
            this.#cx = node.x;
            this.#cy = node.y;
            return;
        }
        const existing = this.#node;
        this.#node = null;
        this.#subdivide();
        this.#getQuadrant(existing.x, existing.y)?.insert(existing);
        this.#getQuadrant(node.x, node.y)?.insert(node);
        this.#mass = existing.mass + node.mass;
        this.#cx = (existing.x * existing.mass + node.x * node.mass) / this.#mass;
        this.#cy = (existing.y * existing.mass + node.y * node.mass) / this.#mass;
    }

    #subdivide() {
        const hw = this.#w / 2, hh = this.#h / 2;
        this.#children = [
            new Quadtree(this.#x, this.#y, hw, hh),
            new Quadtree(this.#x + hw, this.#y, hw, hh),
            new Quadtree(this.#x, this.#y + hh, hw, hh),
            new Quadtree(this.#x + hw, this.#y + hh, hw, hh),
        ];
    }

    #getQuadrant(x, y) {
        const mx = this.#x + this.#w / 2, my = this.#y + this.#h / 2;
        const idx = (x >= mx ? 1 : 0) + (y >= my ? 2 : 0);
        return this.#children[idx];
    }

    computeForce(node, theta, repulsion) {
        if (!this.#mass || (this.#node === node)) return { fx: 0, fy: 0 };
        const dx = this.#cx - node.x, dy = this.#cy - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        if (this.#children && (this.#w / dist) > theta) {
            let fx = 0, fy = 0;
            for (const child of this.#children) {
                const f = child.computeForce(node, theta, repulsion);
                fx += f.fx; fy += f.fy;
            }
            return { fx, fy };
        }
        const force = -repulsion * this.#mass / (dist * dist);
        return { fx: force * dx / dist, fy: force * dy / dist };
    }
}