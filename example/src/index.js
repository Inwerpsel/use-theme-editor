import { setupThemeEditor } from "../../src/initializeThemeEditor";

const KEY = 'all-the-themes';

setupThemeEditor({
    serverThemes: {
        fetchThemes: () => {
            return JSON.parse(localStorage.getItem(KEY));
        },
        uploadTheme: (name, theme) => {
            const themes = JSON.parse(localStorage.getItem(KEY)) || {};
            themes[name] = theme;
            localStorage.setItem(KEY, JSON.stringify(themes, null, 2) )
        },
        deleteTheme: (name) => {
            const themes = JSON.parse(localStorage.getItem(KEY)) || {};
            delete themes[name];
            localStorage.setItem(KEY, JSON.stringify(themes, null, 2) )
        },
    },
});