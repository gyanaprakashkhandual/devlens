import { severityColor } from '../utils/ColorUtils.js';

export class FindingCard {
    static render(finding, onJumpToLine) {
        const card = document.createElement('div');
        card.className = `finding-card finding-${finding.severity || 'info'}`;
        card.setAttribute('role', 'listitem');
        const color = severityColor(finding.severity || 'info');
        card.innerHTML = `
            <div class="finding-header">
                <span class="finding-badge" style="background:${color}">${(finding.severity || 'info').toUpperCase()}</span>
                <span class="finding-rule">${finding.ruleId || finding.id || ''}</span>
                <span class="finding-loc">${finding.line ? `Line ${finding.line}${finding.col ? ':' + finding.col : ''}` : ''}</span>
            </div>
            <div class="finding-message">${this.#escape(finding.message || finding.description || '')}</div>
            ${finding.snippet ? `<pre class="finding-snippet"><code>${this.#escape(finding.snippet)}</code></pre>` : ''}
            ${finding.detail ? `<div class="finding-detail">${this.#escape(finding.detail)}</div>` : ''}
        `;
        if (finding.line && onJumpToLine) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => onJumpToLine(finding.line));
        }
        return card;
    }

    static renderGroup(label, findings, onJumpToLine) {
        const group = document.createElement('div');
        group.className = 'finding-group';
        const header = document.createElement('div');
        header.className = 'finding-group-header';
        header.textContent = `${label} (${findings.length})`;
        header.addEventListener('click', () => group.classList.toggle('collapsed'));
        group.appendChild(header);
        const list = document.createElement('div');
        list.className = 'finding-group-body';
        list.setAttribute('role', 'list');
        for (const f of findings) list.appendChild(FindingCard.render(f, onJumpToLine));
        group.appendChild(list);
        return group;
    }

    static #escape(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}