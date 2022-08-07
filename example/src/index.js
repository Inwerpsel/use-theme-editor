import { setupThemeEditor } from "../../src/initializeThemeEditor";


setupThemeEditor({
    serverThemes: {
        fetchThemes: () => { console.log('fetch') },
        uploadTheme: () => { console.log('upload') },
        deleteTheme: () => { console.log('delete') },
    },
});