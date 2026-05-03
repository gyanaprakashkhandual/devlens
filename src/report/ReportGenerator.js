import { buildReportHTML } from './ReportTemplate.js';

export class ReportGenerator {
    #state;
    #bus;

    constructor(state, bus) {
        this.#state = state;
        this.#bus = bus;
    }

    generate(options = {}) {
        const files = this.#state.get('session.files') || {};
        const allResults = this.#state.get('session.results') || {};
        const settings = this.#state.get('session.settings') || {};

        const includedFiles = options.fileNames
            ? Object.fromEntries(Object.entries(files).filter(([k]) => options.fileNames.includes(k)))
            : files;

        const includedResults = Object.fromEntries(
            Object.keys(includedFiles).map(name => [name, allResults[name] || {}])
        );

        const data = {
            files: includedFiles,
            results: includedResults,
            settings,
            generatedAt: Date.now(),
            modules: options.modules || ['analysis', 'accessibility', 'memory', 'dependency'],
        };

        const html = buildReportHTML(data);
        this.#download(html);
        this.#bus.emit('report:generated', { fileCount: Object.keys(includedFiles).length });
        return html;
    }

    preview(container) {
        const files = this.#state.get('session.files') || {};
        const allResults = this.#state.get('session.results') || {};
        const settings = this.#state.get('session.settings') || {};
        const html = buildReportHTML({ files, results: allResults, settings, generatedAt: Date.now() });
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width:100%;height:100%;border:none;';
        iframe.setAttribute('title', 'Report preview');
        iframe.setAttribute('sandbox', 'allow-same-origin');
        container.innerHTML = '';
        container.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
    }

    #download(html) {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devlens-report-${Date.now()}.html`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
}