import { EventBus } from './core/EventBus.js';
import { StateStore } from './core/StateStore.js';
import { SessionManager } from './core/SessionManager.js';
import { Router } from "./core/Router.js"

import { FileReaderController } from './ingestion/FileReader.js';

import { IDBAdapter } from './storage/IDBAdapter.js';
import { SettingsStore } from './storage/SettingsStore.js';

import { ThemeController } from './ui/theme/ThemeController.js';
import { Toolbar } from './ui/components/Toolbar.js';
import { Toast } from './ui/components/Toast.js';
import { Modal } from './ui/components/Modal.js';
import { PanelManager } from './ui/layout/PanelManager.js';
import { SplitView } from './ui/layout/SplitView.js';

import { EditorPanel } from './ui/panels/EditorPanel.js';
import { AnalysisPanel } from './ui/panels/AnalysisPanel.js';
import { ScopePanel } from './ui/panels/ScopePanel.js';
import { ProfilerPanel } from './ui/panels/ProfilerPanel.js';
import { AccessibilityPanel } from './ui/panels/AccessibilityPanel.js';
import { MemoryPanel } from './ui/panels/MemoryPanel.js';
import { DependencyPanel } from './ui/panels/DependencyPanel.js';
import { SandboxPanel } from './ui/panels/SandboxPanel.js';
import { ReportPanel } from './ui/panels/ReportPanel.js';

import { logger } from './utils/Logger.js';

async function boot() {
    const bus = new EventBus();
    const state = new StateStore();
    const session = new SessionManager(bus, state);

    const settings = await SettingsStore.getAll();
    state.set('session.settings', settings);

    const theme = new ThemeController(SettingsStore);
    await theme.init();

    const toolbar = new Toolbar(document.getElementById('toolbar'), bus);

    const rootSplit = new SplitView(document.getElementById('app-body'), {
        direction: 'horizontal',
        ratio: 0.42,
    });

    const editorPanel = new EditorPanel(bus, state);
    rootSplit.paneA.appendChild(editorPanel.element);
    rootSplit.paneA.style.overflow = 'hidden';

    const nav = document.getElementById('panel-nav');
    const panelContainer = document.getElementById('panel-container');
    panelContainer.style.cssText = 'flex:1;overflow:hidden;position:relative;';
    rootSplit.paneB.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;';
    rootSplit.paneB.appendChild(nav);
    rootSplit.paneB.appendChild(panelContainer);

    const manager = new PanelManager(panelContainer, nav, bus);

    const analysisPanel = new AnalysisPanel(bus, state, editorPanel);
    const scopePanel = new ScopePanel(bus, state);
    const profilerPanel = new ProfilerPanel(bus, state);
    const accessibilityPanel = new AccessibilityPanel(bus, state);
    const memoryPanel = new MemoryPanel(bus, state);
    const dependencyPanel = new DependencyPanel(bus, state);
    const sandboxPanel = new SandboxPanel(bus, state);
    const reportPanel = new ReportPanel(bus, state);

    manager
        .register('analysis',     'Analyze',       analysisPanel,     'Ctrl+1')
        .register('scope',        'Scope',          scopePanel,        'Ctrl+2')
        .register('profiler',     'Profile',        profilerPanel,     'Ctrl+3')
        .register('accessibility','Accessibility',  accessibilityPanel,'Ctrl+4')
        .register('memory',       'Memory',         memoryPanel,       'Ctrl+5')
        .register('dependency',   'Dependencies',   dependencyPanel,   'Ctrl+6')
        .register('sandbox',      'Sandbox',        sandboxPanel,      'Ctrl+7')
        .register('report',       'Report',         reportPanel,       'Ctrl+8');

    manager.activate('analysis');

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileReader = new FileReaderController(bus, session);
    fileReader.bindDropZone(dropZone);
    fileReader.bindFileInput(fileInput);

    const pasteArea = document.getElementById('paste-area');
    const pasteBtn = document.getElementById('paste-ingest-btn');
    const pasteNameInput = document.getElementById('paste-filename');
    if (pasteBtn && pasteArea && pasteNameInput) {
        pasteBtn.addEventListener('click', () => {
            const name = pasteNameInput.value.trim() || 'snippet.js';
            const content = pasteArea.value;
            if (!content.trim()) { Toast.warn('Paste some code first.'); return; }
            fileReader.ingestText(name, content);
            pasteArea.value = '';
            pasteNameInput.value = '';
            hideDropZone();
        });
    }

    bus.on('ingestion:start', () => {
        hideDropZone();
    });

    bus.on('ingestion:file-ready', (file) => {
        state.set('session.activeFile', file.name);
        Toast.success(`Loaded: ${file.name}`);
    });

    bus.on('ingestion:complete', ({ files }) => {
        if (files.length > 1) Toast.success(`${files.length} files loaded.`);
    });

    bus.on('ingestion:error', ({ message }) => Toast.error(message));
    bus.on('ingestion:file-error', ({ name, message }) => Toast.error(`${name}: ${message}`));

    bus.on('toolbar:open-file', () => fileReader.openPicker());
    bus.on('toolbar:re-analyze', () => {});
    bus.on('toolbar:toggle-theme', () => theme.toggle());
    bus.on('toolbar:generate-report', () => {
        manager.activate('report');
    });
    bus.on('toolbar:export-session', () => {
        session.exportSession();
        Toast.success('Session exported.');
    });

    bus.on('panel:activated', ({ id }) => {
        if (id === 'editor') {
            editorPanel.element.scrollIntoView?.({ behavior: 'smooth' });
        }
    });

    bus.on('editor:close-file', async ({ name }) => {
        await session.removeFile(name);
        const files = state.get('session.files') || {};
        const remaining = Object.keys(files);
        state.set('session.activeFile', remaining[0] || null);
        if (!remaining.length) showDropZone();
        Toast.info(`Closed: ${name}`);
    });

    setupKeyboardShortcuts(bus, manager, fileReader, theme, session);

    await session.init();

    const sessionFiles = state.get('session.files') || {};
    if (Object.keys(sessionFiles).length === 0) {
        showDropZone();
    } else {
        hideDropZone();
        const firstName = Object.keys(sessionFiles)[0];
        state.set('session.activeFile', firstName);
    }

    logger.info('DevLens booted.');
}

function showDropZone() {
    const dz = document.getElementById('drop-zone-overlay');
    if (dz) dz.style.display = '';
}

function hideDropZone() {
    const dz = document.getElementById('drop-zone-overlay');
    if (dz) dz.style.display = 'none';
}

function setupKeyboardShortcuts(bus, manager, fileReader, theme, session) {
    document.addEventListener('keydown', (e) => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key === 'o') { e.preventDefault(); fileReader.openPicker(); }
        if (ctrl && e.shiftKey && e.key === 'D') { e.preventDefault(); theme.toggle(); }
        if (ctrl && e.shiftKey && e.key === 'R') { e.preventDefault(); bus.emit('toolbar:generate-report', {}); }
        if (ctrl && e.shiftKey && e.key === 'Enter') { e.preventDefault(); bus.emit('toolbar:re-analyze', {}); }
        if (ctrl && e.key === 'w') {
            e.preventDefault();
            const active = manager.getActive();
            bus.emit('editor:close-file', { name: active });
        }
    });
}

boot().catch((err) => {
    logger.error('Boot failed:', err);
    document.body.innerHTML = `<div style="padding:2rem;color:#e05c5c;font-family:monospace;">
        DevLens failed to start: ${err.message}<br>
        Open the browser console for details.
    </div>`;
});