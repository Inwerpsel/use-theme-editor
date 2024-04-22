import { useGlobalState, useUniqueEffect } from './useGlobalState';

let config = {};

export function setServerConfig(newConfig) {
  config = newConfig;
}

export const useServerThemes = () => {
  const {
    fetchThemes,
    uploadTheme,
    deleteTheme,
  } = config;

  const [serverThemes, setServerThemes] = useGlobalState('serverThemes', []);
  const [loading, setLoading] = useGlobalState('serverThemesLoading', true);
  // We only use this boolean to always trigger logic when it changes.
  // Probably should use another name for it.
  const [dirty, setDirty] = useGlobalState('serverThemesDirty', false);

  useUniqueEffect('serverThemesDirty', () => {
    const doApiCall = async () => {
      const themes = await fetchThemes();
      setServerThemes({
        'default': {
          scopes: {},
        },
        ...themes,
      });
      setLoading(false);
    };
    doApiCall();
  });

  return [serverThemes, {
    serverThemes,
    serverThemesLoading: loading,
    uploadTheme: async (name, scopes) => {
      setLoading(true);
      await uploadTheme(name, {name, scopes});
      setDirty(!dirty);
    },
    deleteTheme: async (name) => {
      setLoading(true);
      await deleteTheme(name);
      setDirty(!dirty);
    }
  }];
};

