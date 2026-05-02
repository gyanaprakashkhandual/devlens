const STORAGE_KEY = 'devlens-theme';
const SYSTEM_PREFERS_DARK = window.matchMedia('(prefers-color-scheme: dark)').matches;

export class ThemeManager {
    constructor() {
        this.currentTheme = this.getSavedTheme();
        this.init();
    }

    getSavedTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return saved;
        return SYSTEM_PREFERS_DARK ? 'dark' : 'light';
    }

    init() {
        this.applyTheme(this.currentTheme);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
    }

    setTheme(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
        this.applyTheme(theme);
    }

    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    }

    isDark() {
        return this.currentTheme === 'dark';
    }
}

const themeManager = new ThemeManager();
export default themeManager;