import {exportCss, exportJson} from '../../functions/export';
import {readFromUploadedFile} from '../../functions/readFromUploadedFile';
import React, {useContext, useState} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {ACTIONS, ROOT_SCOPE} from '../../hooks/useThemeEditor';
import {Checkbox} from '../controls/Checkbox';
import { TextControl } from '../controls/TextControl';
import { use } from '../../state';

export function ImportExportTools() {
  const {
    dispatch,
    scopes,
  } = useContext(ThemeEditorContext);
  const theme = scopes[ROOT_SCOPE] || {};
  const [fileName, setFileName,] = use.fileName();

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
    <TextControl
      value={''}
      placeholder={'Drop/paste JSON here to import as a new theme'}
      style={{border: '1px dashed black', width: '100%'}}
      onChange={value => {
        try {
          const dropped = JSON.parse(value);
          // const ensured = ensureValidCssVariables(dropped);
          const newTheme = !shouldMerge ? dropped : {...theme, ...dropped};
          dispatch({type: ACTIONS.loadTheme, payload: {theme: newTheme}});
        } catch (e) {
          console.log(e)
        }
      }}
    />
  </div>;
}
