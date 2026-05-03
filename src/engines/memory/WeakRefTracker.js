export class WeakRefTracker {
    #registry = new FinalizationRegistry((id) => {
        this.#collected.add(id);
        this.#pending.delete(id);
    });
    #pending = new Map();
    #collected = new Set();
    #nextId = 0;

    track(obj, label = '') {
        const id = this.#nextId++;
        const ref = new WeakRef(obj);
        this.#pending.set(id, { ref, label, trackedAt: Date.now() });
        this.#registry.register(obj, id);
        return id;
    }

    isAlive(id) {
        const entry = this.#pending.get(id);
        if (!entry) return false;
        return entry.ref.deref() !== undefined;
    }

    isCollected(id) {
        return this.#collected.has(id);
    }

    getLiveCount() {
        return [...this.#pending.values()].filter(e => e.ref.deref() !== undefined).length;
    }

    getCollectedCount() {
        return this.#collected.size;
    }

    getLiveEntries() {
        return [...this.#pending.entries()]
            .filter(([, e]) => e.ref.deref() !== undefined)
            .map(([id, e]) => ({ id, label: e.label, trackedAt: e.trackedAt }));
    }

    clear() {
        this.#pending.clear();
        this.#collected.clear();
        this.#nextId = 0;
    }
}