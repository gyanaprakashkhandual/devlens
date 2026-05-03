export function createTracingProxy(target, onCall) {
    return new Proxy(target, {
        apply(fn, thisArg, args) {
            const start = performance.now();
            let result;
            let threw = false;
            try {
                result = Reflect.apply(fn, thisArg, args);
            } catch (e) {
                threw = true;
                onCall({ name: fn.name || '(anonymous)', duration: performance.now() - start, threw: true });
                throw e;
            }
            const duration = performance.now() - start;
            onCall({ name: fn.name || '(anonymous)', duration, threw: false });
            return result;
        },
        get(obj, prop) {
            const val = Reflect.get(obj, prop);
            if (typeof val === 'function') return createTracingProxy(val.bind(obj), onCall);
            return val;
        },
    });
}

export function createReadOnlyProxy(target) {
    return new Proxy(target, {
        set(obj, prop, value) {
            console.warn(`[DevLens] Attempted write to read-only proxy: ${String(prop)}`);
            return false;
        },
        deleteProperty() {
            return false;
        },
    });
}

export function createMutationProxy(target, onChange) {
    return new Proxy(target, {
        set(obj, prop, value) {
            const old = obj[prop];
            const result = Reflect.set(obj, prop, value);
            if (result) onChange({ prop: String(prop), oldValue: old, newValue: value });
            return result;
        },
    });
}