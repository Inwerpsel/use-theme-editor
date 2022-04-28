import {exportCss, exportJson} from '../../functions/export';
import {readFromUploadedFile} from '../../functions/readFromUploadedFile';
import React, {useContext} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';

export function ImportExportTools() {
  const {
    dispatch,
    fileName,
    theme,
  } = useContext(ThemeEditorContext);

  const themeEmpty = Object.keys(theme).length === 0;

  return <div
    style={{
      background: 'white',
      padding: '16px',
    }}
  >
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
            readFromUploadedFile(dispatch, event);
          }}
          style={{cursor: 'copy'}}
        />
      </label>
    </div>
  </div>;
}
