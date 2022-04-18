import {ACTIONS} from '../hooks/useThemeEditor';

export const readFromUploadedFile = (dispatch, event) => {
  const reader = new FileReader();

  reader.onload = event => {
    try {
      const theme = JSON.parse(event.target.result);
      dispatch({ type: ACTIONS.loadTheme, payload: { theme } });
    } catch (e) {
      console.log('File contents is not valid JSON.', event.target.result, event);
    }
  };
  reader.readAsText(event.target.files[0]);
};
