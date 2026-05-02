export class PerformanceCollector {
    #observer = null;
    #longTasks = [];
    #layoutShifts = [];
    #paints = [];

    start() {
        this.#longTasks = [];
        this.#layoutShifts = [];
        this.#paints = [];

        if ('PerformanceObserver' in window) {
            try {
                this.#observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'longtask') {
                            this.#longTasks.push({ startTime: entry.startTime, duration: entry.duration });
                        } else if (entry.entryType === 'layout-shift') {
                            this.#layoutShifts.push({ startTime: entry.startTime, value: entry.value });
                        } else if (entry.entryType === 'paint') {
                            this.#paints.push({ name: entry.name, startTime: entry.startTime });
                        }
                    }
                });
                this.#observer.observe({ entryTypes: ['longtask', 'layout-shift', 'paint'] });
            } catch { }
        }
    }

    stop() {
        if (this.#observer) { this.#observer.disconnect(); this.#observer = null; }
        return this.collect();
    }

    collect() {
        const navEntries = performance.getEntriesByType('navigation');
        const nav = navEntries[0] || {};
        return {
            longTasks: [...this.#longTasks],
            layoutShifts: [...this.#layoutShifts],
            paints: [...this.#paints],
            navigationTiming: {
                domContentLoaded: nav.domContentLoadedEventEnd || 0,
                loadEvent: nav.loadEventEnd || 0,
                firstByte: nav.responseStart || 0,
            },
        };
    }
}