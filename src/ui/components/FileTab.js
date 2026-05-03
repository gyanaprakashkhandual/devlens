export class FileTab {
    static render(file, isActive, onSelect, onClose) {
        const tab = document.createElement('div');
        tab.className = `file-tab${isActive ? ' active' : ''}`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
        tab.dataset.name = file.name;

        const ext = file.name.split('.').pop().toLowerCase();
        const iconMap = { js: 'JS', mjs: 'MJ', ts: 'TS', html: 'HT', css: 'CS', json: 'JN' };
        const icon = iconMap[ext] || 'F';

        tab.innerHTML = `
            <span class="tab-icon tab-icon-${ext}" aria-hidden="true">${icon}</span>
            <span class="tab-name">${file.name}</span>
            <button class="tab-close" aria-label="Close ${file.name}" tabindex="-1">x</button>
        `;

        tab.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close')) { e.stopPropagation(); onClose?.(file.name); }
            else onSelect?.(file.name);
        });
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelect?.(file.name);
            if (e.key === 'Delete' || e.key === 'Backspace') onClose?.(file.name);
        });

        return tab;
    }

    static renderList(files, activeFile, container, onSelect, onClose) {
        container.innerHTML = '';
        container.setAttribute('role', 'tablist');
        for (const file of Object.values(files)) {
            container.appendChild(FileTab.render(file, file.name === activeFile, onSelect, onClose));
        }
    }
}