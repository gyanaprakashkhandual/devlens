import { validateFile, validateBatch } from './FileSizeValidator.js';
import { decodeBuffer } from './EncodingDetector.js';

export class BatchIngestionController {
    #bus;
    #session;

    constructor(bus, session) {
        this.#bus = bus;
        this.#session = session;
    }

    async ingestFiles(fileList) {
        const files = [...fileList];
        const batchCheck = validateBatch(files);
        if (!batchCheck.valid) {
            this.#bus.emit('ingestion:error', { message: batchCheck.error });
            return [];
        }

        const valid = [];
        for (const file of files) {
            const check = validateFile(file);
            if (!check.valid) {
                this.#bus.emit('ingestion:file-error', { name: file.name, message: check.error });
                continue;
            }
            valid.push(file);
        }

        if (valid.length === 0) return [];

        this.#bus.emit('ingestion:start', { count: valid.length });

        const results = await Promise.all(valid.map(f => this.#readFile(f)));
        const ingested = results.filter(Boolean);

        for (const file of ingested) {
            await this.#session.saveFile(file);
            this.#bus.emit('ingestion:file-ready', file);
        }

        this.#bus.emit('ingestion:complete', { files: ingested });
        return ingested;
    }

    async ingestText(name, content) {
        const size = new Blob([content]).size;
        const file = { name, content, type: this.#inferType(name), size, ingestedAt: Date.now() };
        const check = validateFile({ name, size });
        if (!check.valid) {
            this.#bus.emit('ingestion:error', { message: check.error });
            return null;
        }
        await this.#session.saveFile(file);
        this.#bus.emit('ingestion:file-ready', file);
        this.#bus.emit('ingestion:complete', { files: [file] });
        return file;
    }

    async #readFile(file) {
        try {
            const buffer = await file.arrayBuffer();
            const content = decodeBuffer(buffer);
            return {
                name: file.name,
                content,
                type: this.#inferType(file.name),
                size: file.size,
                ingestedAt: Date.now(),
            };
        } catch (e) {
            this.#bus.emit('ingestion:file-error', { name: file.name, message: e.message });
            return null;
        }
    }

    #inferType(name) {
        const ext = name.split('.').pop().toLowerCase();
        const map = { js: 'javascript', mjs: 'javascript', ts: 'typescript', html: 'html', css: 'css', json: 'json' };
        return map[ext] || 'text';
    }
}