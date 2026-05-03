export function debounce(fn, delay) {
    let timer = null;
    function debounced(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => { timer = null; fn.apply(this, args); }, delay);
    }
    debounced.cancel = () => { clearTimeout(timer); timer = null; };
    debounced.flush = function(...args) { clearTimeout(timer); timer = null; fn.apply(this, args); };
    return debounced;
}

export function throttle(fn, limit) {
    let last = 0;
    let timer = null;
    return function(...args) {
        const now = Date.now();
        const remaining = limit - (now - last);
        if (remaining <= 0) {
            clearTimeout(timer);
            last = now;
            fn.apply(this, args);
        } else {
            clearTimeout(timer);
            timer = setTimeout(() => { last = Date.now(); fn.apply(this, args); }, remaining);
        }
    };
}

export function rafDebounce(fn) {
    let frame = null;
    return function(...args) {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => { frame = null; fn.apply(this, args); });
    };
}