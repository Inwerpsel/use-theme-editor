// import {diffSummary} from '../../functions/diffThemes';
import React, {useContext} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import { TextControl } from '../controls/TextControl';
import { use } from '../../state';

export function ThemeUploadPanel() {
  const [fileName, setFileName] = use.fileName();

  const {
    existsOnServer,
    modifiedServerVersion,
    // serverThemes,
    uploadTheme,
    scopes,
  } = useContext(ThemeEditorContext);

  return <div>
    <TextControl
      value={fileName}
      onChange={setFileName}
      style={ { width: '130px', clear: 'both' } }
      placeholder='theme'
    />
    <button
      // title={existsOnServer ? `Save on server. Changes: ${diffSummary(serverThemes[fileName], theme)}` : 'Upload this theme to the server. You can upload as many as you want.'}
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