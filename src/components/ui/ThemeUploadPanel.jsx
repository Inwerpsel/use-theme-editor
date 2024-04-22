// import {diffSummary} from '../../functions/diffThemes';
import React from 'react';
import { TextControl } from '../controls/TextControl';
import { get, use } from '../../state';

export function ThemeUploadPanel() {
  const {
    existsOnServer,
    modifiedServerVersion,
    themeEditor: { scopes },
  } = get;
  const [fileName, setFileName] = use.fileName();

  const [, {uploadTheme}] = use.serverThemes();

  return <div>
    <TextControl
      value={fileName}
      onChange={setFileName}
      style={ { width: '130px', clear: 'both' } }
      placeholder='theme'
    />
    <button
      style={{clear: 'both'}}
      disabled={!fileName || fileName === 'default'}
      onClick={ async () => {
        if (existsOnServer && !confirm('Overwrite theme on server?')) {
          return;
        }
        uploadTheme(fileName, scopes);
      }}
    >
      { existsOnServer ? `Save${ !modifiedServerVersion ? '' : ' (*)'}` : 'Upload'}
    </button>
  </div>;
}

ThemeUploadPanel.fName = 'ThemeUploadPanel';