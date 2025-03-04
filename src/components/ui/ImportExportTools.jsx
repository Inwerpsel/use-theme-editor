import {exportCss, exportThemeJson} from '../../functions/export';
import {readFromUploadedFile} from '../../functions/readFromUploadedFile';
import React, {Fragment, useContext, useState} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {ACTIONS, editTheme, ROOT_SCOPE} from '../../hooks/useThemeEditor';
import {Checkbox} from '../controls/Checkbox';
import { TextControl } from '../controls/TextControl';
import { use } from '../../state';
import { importHistory, useDispatcher } from '../../hooks/useResumableReducer';
import kapowColorful from '../../data/kapow-colorful-2.json';
import kapowGray from '../../data/kapow-gray.json';
import { ToggleButton } from '../controls/ToggleButton';

function load(theme, name) {
  const dispatch = editTheme();
  const setFilename = useDispatcher('fileName');
  return () => {
    dispatch({ type: ACTIONS.loadTheme, payload: { theme } });
    setFilename(name);
  };
}

function Samples() {
  const [open, setOpen] = useState(false);

  return <Fragment>
    <ToggleButton controls={[open, setOpen]}>Presets</ToggleButton>
    {open && <Fragment>
      <button onClick={load(kapowGray, 'kapow-gray')}>Kapow gray</button>
      <button onClick={load(kapowColorful, 'kapow-colorful')}>Kapow colors</button>
      </Fragment>}
  </Fragment>
}

export function ImportExportTools() {
  const [{scopes}, dispatch] = use.themeEditor();
  const {
    frameRef,
    scrollFrameRef,
  } = useContext(ThemeEditorContext);
  const theme = scopes[ROOT_SCOPE] || {};
  const [fileName, setFileName,] = use.fileName();

  const [shouldMerge, setShouldMerge] = useState(false);
  const [shouldOpenUrl, setShouldOpenUrl] = useState(false);

  return <div
    style={{
      background: 'white',
      padding: '16px',
    }}
  >
    <Samples />
    <div>
      <Checkbox controls={[shouldMerge, setShouldMerge]}>Merge into current theme</Checkbox>
    </div>
    <div>
      <button onClick={() => exportThemeJson(fileName, scopes)}>
        Export JSON
      </button>
      <button onClick={() => exportCss(fileName, scopes)}>
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
    <div>
      
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
