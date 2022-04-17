import {diffSummary} from '../functions/diffThemes';
import React, {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';

export function ThemeUploadPanel() {
  const {
    fileName,
    setFileName,
    existsOnServer,
    modifiedServerVersion,
    serverThemes,
    uploadTheme,
    theme,
  } = useContext(ThemeEditorContext);

  return <div>
    <input
      value={fileName}
      style={ { width: '130px', clear: 'both' } }
      placeholder='theme'
      type="text"
      onChange={ event => setFileName(event.target.value) }/>
    <button
      title={existsOnServer ? `Save on server. Changes: ${diffSummary(serverThemes[fileName], theme)}` : 'Upload this theme to the server. You can upload as many as you want.'}
      style={{clear: 'both'}}
      disabled={!fileName || fileName === 'default'}
      onClick={ async () => {
        if (existsOnServer && !confirm('Overwrite theme on server?')) {
          return;
        }
        uploadTheme(fileName, theme);
      }}
    >
      { existsOnServer ? `Save${ !modifiedServerVersion ? '' : ' (*)'}` : 'Upload'}
    </button>
  </div>;
}
