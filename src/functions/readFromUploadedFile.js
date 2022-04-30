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
      const newTheme = !shouldMerge ? ensured : {...prevTheme, ...ensured};
      dispatch({type: ACTIONS.loadTheme, payload: {theme: newTheme}});
      name && setFileName(name.replace('.json', ''));
    } catch (e) {
      console.log('File contents is not valid JSON.', event.target.result, event);
    }
  };
  reader.readAsText(event.target.files[0]);
};
