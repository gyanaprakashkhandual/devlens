import { detectLeaks } from './LeakDetector.js';

self.onmessage = (e) => {
    const { id, source } = e.data;
    try {
        const findings = detectLeaks(source);
        self.postMessage({ id, findings });
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};