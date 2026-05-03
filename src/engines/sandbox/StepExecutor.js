export class StepExecutor {
    #host;
    #onStep;
    #onDone;
    #onError;
    #unsubscribers = [];

    constructor(host) {
        this.#host = host;
    }

    onStep(fn) { this.#onStep = fn; return this; }
    onDone(fn) { this.#onDone = fn; return this; }
    onError(fn) { this.#onError = fn; return this; }

    run(code) {
        this.#cleanup();
        this.#unsubscribers.push(
            this.#host.on('done', (data) => { this.#cleanup(); this.#onDone?.(data); }),
            this.#host.on('error', (data) => { this.#cleanup(); this.#onError?.(data); }),
            this.#host.on('step', (data) => { this.#onStep?.(data); }),
        );
        this.#host.run(code);
    }

    stepRun(code, breakpoints = []) {
        this.#cleanup();
        this.#unsubscribers.push(
            this.#host.on('done', (data) => { this.#cleanup(); this.#onDone?.(data); }),
            this.#host.on('error', (data) => { this.#cleanup(); this.#onError?.(data); }),
            this.#host.on('step', (data) => { this.#onStep?.(data); }),
        );
        this.#host.stepRun(code, breakpoints);
    }

    resume() { this.#host.resume(); }

    stop() { this.#cleanup(); }

    #cleanup() {
        for (const unsub of this.#unsubscribers) unsub();
        this.#unsubscribers = [];
    }
}