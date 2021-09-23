import {useEffect, useRef, useState, Fragment} from 'react';
import {THEME_ACTIONS, useThemeEditor} from '../hooks/useThemeEditor';
import {useLocalStorage} from '../hooks/useLocalStorage';
import {useHotkeys} from 'react-hotkeys-hook';
import {useServerThemes} from '../hooks/useServerThemes';
import {diffSummary, diffThemes} from '../diffThemes';
import {ResizableFrame} from './ResizableFrame';
import {createPortal} from 'react-dom';
import {ServerThemesList} from './ServerThemesList';
import {exportCss, exportJson} from '../export';
import {GroupControl} from './GroupControl';
import {readFromUploadedFile} from './readFromUploadedFile';
import {CustomVariableInput} from './CustomVariableInput';
import {StylesheetDisabler} from './StylesheetDisabler';

const hotkeysOptions = {
  enableOnTags: ['INPUT', 'SELECT', 'RADIO'],
}

export const ThemeEditor = (props) => {
  const {
    config,
    groups,
    allVars,
  } = props;
  const [openGroups, setOpenGroups] = useState([]);
  const toggleGroup = id => {
    const newGroups = openGroups.includes(id)
      ? openGroups.filter(openId => openId !== id)
      : [...openGroups, id];

    setOpenGroups(newGroups);
  };
  const openFirstGroup = () => {
    setOpenGroups([groups[0]?.label]);
  }
  useEffect(openFirstGroup, [groups]);

  const [
    {
      theme,
      defaultValues,
      history,
      future,
    },
    dispatch,
  ] = useThemeEditor({allVars});

  const [importCollapsed, setImportCollapsed] = useState(true);
  const [storedServerThemesCollapsed, setServerThemesCollapsed] = useLocalStorage('server-themes-collapsed', true);
  const serverThemesCollapsed = !!storedServerThemesCollapsed && storedServerThemesCollapsed !== 'false';
  const [sheetsDisablerCollapsed, setSheetDisablerCollapsed] = useState(true);

  const [fileName, setFileName] = useLocalStorage('p4-theme-name', 'theme');

  const [storedIsResponsive, setResponsive] = useLocalStorage('p4-theme-responsive', false);

  const isResponsive = !!storedIsResponsive && storedIsResponsive !== 'false';

  useHotkeys('alt+v', () => {
    setResponsive(!isResponsive);
  }, [isResponsive]);

  useHotkeys('ctrl+z,cmd+z', () => {
    dispatch({type: THEME_ACTIONS.HISTORY_BACKWARD});
  }, hotkeysOptions);

  useHotkeys('ctrl+shift+z,cmd+shift+z', () => {
    dispatch({type: THEME_ACTIONS.HISTORY_FORWARD});
  }, hotkeysOptions);

  const {
    serverThemes,
    loading: serverThemesLoading,
    uploadTheme,
    deleteTheme,
  } = useServerThemes(config.serverThemes);

  const activeThemeRef = useRef();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      activeThemeRef.current?.scrollIntoView();
    }, 200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [serverThemes, serverThemesCollapsed])

  const existsOnServer = serverThemes && fileName in serverThemes;
  const modifiedServerVersion = existsOnServer && diffThemes(serverThemes[fileName], theme).hasChanges;

  useHotkeys('alt+s', () => {
    if (fileName && fileName !== 'default' && modifiedServerVersion) {
      uploadTheme(fileName, theme);
    }
  },hotkeysOptions, [fileName, modifiedServerVersion, theme]);

  const frameRef = useRef(null);

  const [frameClickBehavior, setFrameClickBehavior] = useLocalStorage('theme-editor-frame-click-behavior', 'any');

  const [responsiveSticky, setResponsiveSticky] = useLocalStorage('responsive-on-load', 'false');

  useHotkeys('alt+a', () => {
    setFrameClickBehavior(value => value=== 'alt' ? 'any' : 'alt');
  }, [frameClickBehavior]);

  useEffect(() => {
    if (!isResponsive) {
      return;
    }
    if (!frameRef?.current || !isResponsive) {
      return;
    }
    const message = {type: 'theme-edit-alt-click', payload: {frameClickBehavior}};
    frameRef.current.contentWindow.postMessage(message, window.location.origin);

  }, [frameClickBehavior, frameRef.current, isResponsive])

  return <div
    className='theme-editor'
  >
    {!!isResponsive && <ResizableFrame {...{frameRef}} src={window.location.href}/>}

    {!!isResponsive && createPortal(<Fragment>
      <button style={{zIndex: 1003, position: 'fixed', bottom: 0, right: '150px'}} onClick={() => {
        setFrameClickBehavior(frameClickBehavior === 'alt' ? 'any' : 'alt');
      }}>{frameClickBehavior === 'alt' ? 'Require ALT for inspect (ON)' : 'Require ALT for inspect (OFF)'}</button>
      <button style={{zIndex: 1003, position: 'fixed', bottom: 0, right: '380px'}} onClick={() => {
        setResponsiveSticky(responsiveSticky === 'true' ? 'false' : 'true');
      }}>{responsiveSticky === 'true' ? 'Sticky responsive (ON)' : 'Sticky responsive (OFF)'}</button>
    </Fragment>, document.body)}
    <input
      type="checkbox"
      readOnly
      checked={ isResponsive }
      onClick={ () => { setResponsive(!isResponsive); } }
    />
    <label
      onClick={ () => {
        setResponsive(!isResponsive);
      } }
      style={ { marginBottom: '2px' } }
    >
      { 'Responsive view' }
    </label>


    <button onClick={() => setImportCollapsed(!importCollapsed)}>Import/export</button>
    <button onClick={() => setSheetDisablerCollapsed(!sheetsDisablerCollapsed)}>Stylesheets</button>
    <StylesheetDisabler collapsed={sheetsDisablerCollapsed}{...{frameRef}}/>

    { !importCollapsed && <div
      style={{position: 'fixed', left: 0, background: 'white'}}
      title='Click and hold to drag'
      className="themer-controls">
      <div>
        <button
          onClick={ () => exportJson(fileName) }
        >Export JSON
        </button>
        <button
          onClick={ () => exportCss(fileName) }
        >Export CSS
        </button>
        <label style={{fontSize: '12px'}}>
        </label>

      </div>
      <div>
        <label
          style={ {
            background: 'rgba(255,255,255,.3)',
            cursor: 'copy'
          } }
        > Upload JSON:
          <input
            type="file"
            accept={ '.json' }
            onChange={ event => { readFromUploadedFile(dispatch)} }
            style={ { cursor: 'copy' } }
          />
        </label>
      </div>
    </div>}
    <div>
      <input value={fileName} style={ { width: '130px', clear: 'both' } } placeholder='theme' type="text"
             onChange={ event => setFileName(event.target.value) }/>
      <button onClick={() => setServerThemesCollapsed(!serverThemesCollapsed)}>server</button>
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
    </div>

    { !serverThemesCollapsed && serverThemesLoading && <div>Loading server themes...</div> }

    { !serverThemesCollapsed && !!serverThemes && !serverThemesLoading && <ServerThemesList { ...{
      serverThemes,
      deleteTheme,
      fileName,
      setFileName,
      activeThemeRef,
      theme,
      modifiedServerVersion,
      dispatch,
    }}/>}
    <CustomVariableInput {...{dispatch, theme}}/>
    <div>
      <button
        style={{float: 'right'}}
        disabled={future.length === 0}
        title={future.length === 0 ? 'No future' : diffSummary(theme, future[0])}
        onClick={() => dispatch({type: THEME_ACTIONS.HISTORY_FORWARD})}
      >redo
      </button>
      <button
        style={{float: 'right'}}
        disabled={history.length === 0}
        title={history.length === 0 ? 'No history' : diffSummary(history[0], theme)}
        onClick={() => dispatch({type: THEME_ACTIONS.HISTORY_BACKWARD})}
      >undo
      </button>
    </div>

    <ul className={'group-list'}>
      { groups.map(({ element, label, vars }) => <GroupControl
        {...{element, label, vars, toggleGroup, defaultValues, theme, frameRef, dispatch}}
        isOpen={openGroups.includes(label)}
      />) }
    </ul>
  </div>;
};
