import { FindingCard } from '../components/FindingCard.js';
import { Toast } from '../components/Toast.js';
import { groupByCriterion, scoreSummary } from '../../engines/accessibility/WCAGRules.js';

export class AccessibilityPanel {
    #el;
    #bus;
    #state;
    #worker = null;
    #resultsEl;
    #summaryEl;

    constructor(bus, state) {
        this.#bus = bus;
        this.#state = state;
        this.#el = document.createElement('div');
        this.#el.className = 'panel accessibility-panel';
        this.#build();
        this.#spawnWorker();
    }

    get element() { return this.#el; }

    #build() {
        this.#el.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">Accessibility Auditor</h2>
                <span class="wcag-badge">WCAG 2.1 AA</span>
                <button class="run-btn" aria-label="Run accessibility audit">Audit</button>
            </div>
            <div class="a11y-score" aria-live="polite"></div>
            <div class="a11y-results" role="list" aria-label="Accessibility findings" aria-live="polite"></div>
        `;
        this.#summaryEl = this.#el.querySelector('.a11y-score');
        this.#resultsEl = this.#el.querySelector('.a11y-results');
        this.#el.querySelector('.run-btn').addEventListener('click', () => this.#run());
    }

    #spawnWorker() {
        try {
            this.#worker = new Worker('./src/engines/accessibility/accessibility.worker.js', { type: 'module' });
            this.#worker.onmessage = (e) => this.#onResult(e.data);
        } catch { Toast.warn('Accessibility worker unavailable.'); }
    }

    #run() {
        const activeFile = this.#state.get('session.activeFile');
        const file = activeFile ? this.#state.get(`session.files.${activeFile}`) : null;
        if (!file || file.type !== 'html') {
            Toast.warn('Select an HTML file to audit.');
            return;
        }
        this.#worker?.postMessage({ id: activeFile, html: file.content });
        this.#resultsEl.innerHTML = '<div class="empty-state">Auditing...</div>';
        this.#summaryEl.innerHTML = '';
    }

    #onResult(data) {
        if (data.error) { Toast.error(`Audit error: ${data.error}`); return; }
        const findings = data.findings || [];
        this.#state.set(`session.results.${data.id}.accessibility`, findings);
        this.#renderScore(findings);
        this.#renderFindings(findings);
    }

    #renderScore(findings) {
        const { score, passed, failed, total } = scoreSummary(findings);
        const color = score >= 80 ? '#5c9e5c' : score >= 50 ? '#e0a84e' : '#e05c5c';
        this.#summaryEl.innerHTML = `
            <div class="score-ring" style="border-color:${color}" aria-label="Accessibility score ${score} out of 100">
                <span class="score-number" style="color:${color}">${score}</span>
                <span class="score-label">/ 100</span>
            </div>
            <div class="score-detail">${passed} passed, ${failed} failed of ${total} checks</div>
        `;
    }

    #renderFindings(findings) {
        this.#resultsEl.innerHTML = '';
        const failures = findings.filter(f => !f.pass);
        if (!failures.length) {
            this.#resultsEl.innerHTML = '<div class="empty-state success">All accessibility checks passed.</div>';
            return;
        }
        const grouped = groupByCriterion(failures);
        for (const group of grouped) {
            const el = FindingCard.renderGroup(
                `${group.rule.criterion} — ${group.rule.title}`,
                group.findings,
                null,
            );
            this.#resultsEl.appendChild(el);
        }
    }

    onActivate() {}
    onDeactivate() {}
}