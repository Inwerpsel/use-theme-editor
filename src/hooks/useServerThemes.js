import { useEffect, useState } from 'react';

export const useServerThemes = (config) => {
  const {
    fetchThemes,
    uploadTheme,
    deleteTheme,
  } = config;

  const [serverThemes, setServerThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
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
  }, [dirty]);

  return {
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
  };
};

