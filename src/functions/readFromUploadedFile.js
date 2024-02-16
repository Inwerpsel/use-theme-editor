import {ACTIONS} from '../hooks/useThemeEditor';

export const readFromUploadedFile = (dispatch, event, shouldMerge, prevTheme, setFileName) => {
  const reader = new FileReader();
  const name = event.target.files[0]?.name;

  reader.onload = event => {
    try {
      const theme = JSON.parse(event.target.result);
      const newScopes = !shouldMerge ? theme : {...prevTheme, ...ensured};
      dispatch({type: ACTIONS.loadTheme, payload: {theme: {scopes: newScopes}}});
      name && setFileName(name.replace('.json', ''));
    } catch (e) {
      console.log('File contents is not valid JSON.', event.target.result, event);
    }
  };
  reader.readAsText(event.target.files[0]);
};
