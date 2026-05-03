export class GCPressure {
    async pressure(iterations = 5) {
        const arrays = [];
        for (let i = 0; i < iterations; i++) {
            arrays.push(new Float64Array(1024 * 256));
            await this.#yield();
        }
        arrays.length = 0;
        await this.#yield();
        await this.#yield();
    }

    #yield() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    async checkSurvivors(tracker) {
        await this.pressure(10);
        return {
            liveCount: tracker.getLiveCount(),
            collectedCount: tracker.getCollectedCount(),
            liveEntries: tracker.getLiveEntries(),
        };
    }
}