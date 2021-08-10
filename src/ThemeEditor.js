import { useEffect, useState, useRef } from 'react';
import { THEME_ACTIONS, useThemeEditor } from './useThemeEditor';
import { exportCss, exportJson } from './export';
import { useServerThemes } from './useServerThemes';
import { useLocalStorage } from './useLocalStorage';
import { ResizableFrame } from './components/ResizableFrame';
import { useHotkeys } from 'react-hotkeys-hook';
import {createPortal} from "react-dom";
import {diffThemes} from "./diffThemes";
import {GroupControl} from "./components/GroupControl";
import {ServerThemesList} from "./components/ServerThemesList";

const hotkeysOptions = {
  enableOnTags: ['INPUT'],
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
    },
    dispatch,
  ] = useThemeEditor({allVars});

  const [collapsed, setCollapsed] = useState(false);

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
    activeThemeRef?.current?.scrollIntoView();
  }, [serverThemes])

  const existsOnServer = serverThemes && Object.keys(serverThemes).some(t => t === fileName);
  const modifiedServerVersion = existsOnServer && diffThemes(serverThemes[fileName], theme).hasChanges;

  useHotkeys('alt+s', () => {
    if (fileName && fileName !== 'default' && modifiedServerVersion) {
      uploadTheme(fileName, theme);
    }
  },hotkeysOptions, [fileName, modifiedServerVersion, theme]);

  const frameRef = useRef(null);

  const [frameClickBehavior, setFrameClickBehavior] = useLocalStorage('theme-editor-frame-click-behavior', 'alt');

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

    {!!isResponsive && createPortal(<button style={{zIndex: 1003,position: 'fixed', bottom: 0, right: '150px'}} onClick={() => {
      setFrameClickBehavior(frameClickBehavior === 'alt' ? 'any' : 'alt');
    }}>{ frameClickBehavior === 'alt' ? 'Require ALT for inspect (ON)' : 'Require ALT for inspect (OFF)'}</button>, document.body)}

    <span
        style={ {
          fontSize: '10px',
          border: '1px solid grey',
          borderRadius: '3px',
          margin: '0 8px',
          padding: '2px 4px',
          background: 'grey',
        } }
        onClick={() => {
          setCollapsed(!collapsed)
        }}
      >
        { collapsed ? 'show' : 'hide' }
    </span>
    <input
      type="checkbox"
      readOnly
      checked={ isResponsive }
      onClick={ () => { setResponsive(!isResponsive); } }
    />
    { !collapsed && <label
      onClick={ () => {
        setResponsive(!isResponsive);
      } }
      style={ { marginBottom: '2px' } }
    >
      { 'Responsive view' }
    </label> }
    { !collapsed && serverThemesLoading && <span>Loading server themes...</span> }
    { !collapsed && !!serverThemes && !serverThemesLoading && <ServerThemesList { ...{
      serverThemes,
      deleteTheme,
      fileName,
      setFileName,
      activeThemeRef,
      theme,
      modifiedServerVersion,
      dispatch,
    }}/>}

    { !collapsed && <div
      title='Click and hold to drag'
      className="themer-controls">
      <div>
        <button
          onClick={ () => exportJson(fileName) }
        >JSON
        </button>
        <button
          onClick={ () => exportCss(fileName) }
        >CSS
        </button>
        <label style={{fontSize: '12px'}}>
          <input value={fileName} style={ { width: '130px' } } placeholder='theme' type="text"
                 onChange={ event => setFileName(event.target.value) }/>
        </label>
        <button
          title={existsOnServer ? 'Save on server' : 'Upload this theme to the server. You can upload as many as you want.'}
          style={{clear: 'both'}}
          disabled={!fileName || fileName === 'default'}
          onClick={ async () => {
            if (existsOnServer && !confirm('Overwrite theme on server?')) {
              return;
            }
            uploadTheme(fileName, theme);
          }}
        >
          { existsOnServer ? 'Save' : 'Upload'}
        </button>
      </div>
      <div>
        <label
          style={ {
            display: 'inline-block',
            maxWidth: '33%',
            overflowX: 'hidden',
            background: 'rgba(255,255,255,.3)',
            cursor: 'copy'
          } }
        >
          <input
            type="file"
            accept={ '.json' }
            onChange={ event => {
              const reader = new FileReader();
              reader.onload = event => {
                try {
                  const theme = JSON.parse(event.target.result);
                  dispatch({ type: THEME_ACTIONS.LOAD_THEME, payload: { theme } });
                } catch (e) {
                  console.log('File contents is not valid JSON.', event.target.result, event);
                }
              };
              reader.readAsText(event.target.files[0]);
            } }
            style={ { cursor: 'copy' } }
          />
        </label>
      </div>
    </div> }

    { !collapsed && <ul className={'group-list'}>
      { groups.map(({ element, label, vars }) => <GroupControl
        {...{element, label, vars, toggleGroup, defaultValues, theme, frameRef, dispatch}}
        isOpen={openGroups.includes(label)}
      />) }
    </ul> }
  </div>;
};
