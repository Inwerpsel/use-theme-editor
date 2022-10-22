import {ACTIONS} from '../hooks/useThemeEditor';

export const ensureValidCssVariables = theme => Object.entries(theme).reduce((result, [k, v]) => ({
  ...result,
  [`--${k.replace(/^-*/, '')}`]: `${v}`,
}), {});

export const readFromUploadedFile = (dispatch, event, shouldMerge, prevTheme, setFileName) => {
  const reader = new FileReader();
  const name = event.target.files[0]?.name;

  reader.onload = event => {
    try {
      const theme = JSON.parse(event.target.result);
      const ensured = ensureValidCssVariables(theme);
      const isNewTheme = 'scopes' in theme;
      let newScopes;
      if (!isNewTheme) {
        newScopes = !shouldMerge ? theme : {...prevTheme, ...ensured};
        dispatch({type: ACTIONS.loadTheme, payload: {theme: newScopes}});
        name && setFileName(name.replace('.json', ''));
      } else {
        alert('New themes not implemented');
      }
    } catch (e) {
      console.log('File contents is not valid JSON.', event.target.result, event);
    }
  };
  reader.readAsText(event.target.files[0]);
};
