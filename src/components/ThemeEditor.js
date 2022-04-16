import {createContext, useEffect, useMemo, useRef, useState} from 'react';
import {THEME_ACTIONS, useThemeEditor} from '../hooks/useThemeEditor';
import {useLocalStorage} from '../hooks/useLocalStorage';
import {useHotkeys} from 'react-hotkeys-hook';
import {useServerThemes} from '../hooks/useServerThemes';
import {diffSummary, diffThemes} from '../functions/diffThemes';
import {ResizableFrame} from './ResizableFrame';
import {ServerThemesList} from './ServerThemesList';
import {exportCss, exportJson} from '../functions/export';
import {GroupControl} from './GroupControl';
import {readFromUploadedFile} from '../functions/readFromUploadedFile';
import {CustomVariableInput} from './CustomVariableInput';
import {StylesheetDisabler} from './StylesheetDisabler';
import {allScreenOptions, simpleScreenOptions} from '../screenOptions';
import {PropertyCategoryFilter} from './PropertyCategoryFilter';
import {isColorProperty} from './TypedControl';
import {PropertySearch} from './PropertySearch';
import {filterSearched} from '../functions/filterSearched';
import {flipDebugMode} from './RenderInfo';
import {byHexValue, extractColorUsages} from './properties/ColorControl';
import {Checkbox} from './Checkbox';
import {ToggleButton} from './ToggleButton';

const hotkeysOptions = {
  enableOnTags: ['INPUT', 'SELECT', 'RADIO'],
}

export const ThemeEditorContext = createContext({});

export const ThemeEditor = (props) => {
  const {
    config,
    groups: unfilteredGroups,
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
    setOpenGroups([unfilteredGroups[0]?.label]);
  }
  useEffect(openFirstGroup, [unfilteredGroups]);

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
  const [serverThemesCollapsed, setServerThemesCollapsed] = useLocalStorage('server-themes-collapsed', true);
  const [sheetsDisablerCollapsed, setSheetDisablerCollapsed] = useState(true);
  const [propertyFilter, setPropertyFilter] = useLocalStorage('property-filter', 'all');
  const [propertySearch, setPropertySearch] = useLocalStorage('property-search', '');

  const groups = useMemo(() => {
    const searched = filterSearched(unfilteredGroups, propertySearch);
    if (propertyFilter === 'all') {
      return searched;
    }
    return searched.map(group => ({
      ...group,
      vars: group.vars.filter(cssVar => cssVar.usages.some(usage => isColorProperty(usage.property)))
    }))
  }, [unfilteredGroups, propertyFilter, propertySearch])

  const [fileName, setFileName] = useLocalStorage('p4-theme-name', 'theme');
  const [isResponsive, setResponsive] = useLocalStorage('p4-theme-responsive', false);

  const [
    width,
    setWidth,
  ] = useLocalStorage('responsive-width', 360);

  const [
    height,
    setHeight,
  ] = useLocalStorage('responsive-height', 640);

  const [isSimpleSizes, setIsSimpleSizes] = useLocalStorage('responsive-simple-sizes', true);

  const screenOptions = isSimpleSizes ? simpleScreenOptions : allScreenOptions;

  useHotkeys('alt+v', () => {
    setResponsive(!isResponsive);
  }, [isResponsive]);

  useHotkeys('alt+r', () => {
    flipDebugMode();
  }, []);

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

  const existsOnServer = serverThemes && fileName in serverThemes;
  const modifiedServerVersion = useMemo(() => {
    return existsOnServer && diffThemes(serverThemes[fileName], theme).hasChanges;
  }, [serverThemes, fileName, theme]);

  useHotkeys('alt+s', () => {
    if (fileName && fileName !== 'default' && modifiedServerVersion) {
      uploadTheme(fileName, theme);
    }
  },hotkeysOptions, [fileName, modifiedServerVersion, theme]);

  const frameRef = useRef(null);

  const [frameClickBehavior, setFrameClickBehavior] = useLocalStorage('theme-editor-frame-click-behavior', 'any');

  useHotkeys('alt+a', () => {
    setFrameClickBehavior(value => value=== 'alt' ? 'any' : 'alt');
  }, [frameClickBehavior]);

  useEffect(() => {
    if (!isResponsive || !frameRef?.current) {
      return;
    }
    const message = {type: 'theme-edit-alt-click', payload: {frameClickBehavior}};
    frameRef.current.contentWindow.postMessage(message, window.location.origin);

  }, [frameClickBehavior, frameRef.current, isResponsive])

  const [useDefaultsPalette, setUseDefaultsPalette] = useLocalStorage('use-defaults-palette', false);
  const [nativeColorPicker, setNativeColorPicker] = useLocalStorage('native-color-picker', true);

  const colorUsages = useMemo(
    () => extractColorUsages(theme, !useDefaultsPalette ? {} : defaultValues).sort(byHexValue),
    [theme, defaultValues, useDefaultsPalette],
  );

  return <ThemeEditorContext.Provider value={{
    theme,
    dispatch,
    defaultValues,
    frameRef,
    width, setWidth,
    height, setHeight,
    isSimpleSizes, setIsSimpleSizes,
    screenOptions,
    propertyFilter, setPropertyFilter,
    propertySearch, setPropertySearch,
    frameClickBehavior, setFrameClickBehavior,
    modifiedServerVersion,
    deleteTheme,
    fileName, setFileName,
    colorUsages,
    nativeColorPicker,
    setSheetDisablerCollapsed,
  }}><div
    className='theme-editor'
  >
    {!!isResponsive && <ResizableFrame src={window.location.href} {...{frameRef, width, height}}/>}

    <div className={'theme-editor-menu'}>
      <ToggleButton controls={[importCollapsed, setImportCollapsed]}>
        Import/export
      </ToggleButton>
      <ToggleButton controls={[sheetsDisablerCollapsed, setSheetDisablerCollapsed]}>
        Stylesheets
      </ToggleButton>
      <ToggleButton controls={[serverThemesCollapsed, setServerThemesCollapsed]}>
        server
      </ToggleButton>
      <Checkbox controls={[isResponsive, setResponsive]}>
        Responsive view
      </Checkbox>
    </div>
    {!sheetsDisablerCollapsed && <StylesheetDisabler/>}

    { !importCollapsed && <div
      style={{position: 'fixed', left: 'var(--theme-editor--ul--width, 360px)', background: 'white'}}
      title='Click and hold to drag'
      className="themer-controls">
      <div>
        <button onClick={() => exportJson(fileName)}>
          Export JSON
        </button>
        <button onClick={() => exportCss(fileName)}>
          Export CSS
        </button>
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
            onChange={ event => { readFromUploadedFile(dispatch, event)} }
            style={ { cursor: 'copy' } }
          />
        </label>
      </div>
    </div>}
    <div>
      <input value={fileName} style={ { width: '130px', clear: 'both' } } placeholder='theme' type="text"
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
    </div>

    { !serverThemesCollapsed && serverThemesLoading && <div>Loading server themes...</div> }

    {!serverThemesCollapsed && !!serverThemes && !serverThemesLoading &&
      <ServerThemesList {...{serverThemes}}/>
    }
    <div style={{display: 'flex', gap: '4px'}}>
      <Checkbox controls={[useDefaultsPalette, setUseDefaultsPalette]}>
        Include default palette
      </Checkbox>
      <Checkbox controls={[nativeColorPicker, setNativeColorPicker]}>
        Native color picker
      </Checkbox>
    </div>
    <div style={{display: 'flex'}}>
      <PropertyCategoryFilter/>
      <PropertySearch/>
    </div>
    <CustomVariableInput/>
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
        {...{
          element,
          label,
          vars,
          toggleGroup,
        }}
        isOpen={openGroups.includes(label)}
      />) }
    </ul>
  </div></ThemeEditorContext.Provider>;
};
