import {exportCss, exportJson} from '../../functions/export';
import {ensureValidCssVariables, readFromUploadedFile} from '../../functions/readFromUploadedFile';
import React, {useContext, useState} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {ACTIONS} from '../../hooks/useThemeEditor';
import {Checkbox} from '../controls/Checkbox';

export function ImportExportTools() {
  const {
    dispatch,
    fileName, setFileName,
    theme,
  } = useContext(ThemeEditorContext);

  const [shouldMerge, setShouldMerge] = useState(false);

  const themeEmpty = Object.keys(theme).length === 0;

  return <div
    style={{
      background: 'white',
      padding: '16px',
    }}
  >
    <div>
      <Checkbox controls={[shouldMerge, setShouldMerge]}>Merge into current theme</Checkbox>
    </div>
    <div>
      <button disabled={themeEmpty} onClick={() => exportJson(fileName)}>
        Export JSON
      </button>
      <button disabled={themeEmpty} onClick={() => exportCss(fileName)}>
        Export CSS
      </button>
    </div>
    <div>
      <label
        style={{
          background: 'rgba(255,255,255,.3)',
          cursor: 'copy',
        }}
      > Upload JSON:
        <input
          type="file"
          accept={'.json'}
          onChange={event => {
            readFromUploadedFile(dispatch, event, shouldMerge, theme, setFileName);
          }}
          style={{cursor: 'copy'}}
        />
      </label>
    </div>
    <input
      type={'text'}
      value={''}
      placeholder={'Drop/paste JSON here to import as a new theme'}
      style={{border: '1px dashed black', width: '100%'}}
      onChange={event => {
        try {
          const dropped = JSON.parse(event.target.value);
          const ensured = ensureValidCssVariables(dropped);
          const newTheme = !shouldMerge ? ensured : {...theme, ...ensured};
          dispatch({type: ACTIONS.loadTheme, payload: {theme: newTheme}});
        } catch (e) {
        }
      }}
    />
  </div>;
}
