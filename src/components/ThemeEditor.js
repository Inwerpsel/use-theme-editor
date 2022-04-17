import React, {createContext, useEffect, useMemo, useRef, useState} from 'react';
import {THEME_ACTIONS, useThemeEditor} from '../hooks/useThemeEditor';
import {useLocalStorage} from '../hooks/useLocalStorage';
import {useHotkeys} from 'react-hotkeys-hook';
import {useServerThemes} from '../hooks/useServerThemes';
import {diffThemes} from '../functions/diffThemes';
import {ResizableFrame} from './ResizableFrame';
import {ServerThemesList} from './ServerThemesList';
import {GroupControl} from './GroupControl';
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
import {ImportExportTools} from './ImportExportTools';
import {ThemeUploadPanel} from './ThemeUploadPanel';
import {HistoryBack} from './HistoryBack';
import {HistoryForward} from './HistoryForward';
import {useGlobalSettings} from '../hooks/useGlobalSettings';

const hotkeysOptions = {
  enableOnTags: ['INPUT', 'SELECT', 'RADIO'],
};

export const ThemeEditorContext = createContext({});

export const ThemeEditor = (props) => {
  const {
    config,
    groups: unfilteredGroups,
    allVars,
  } = props;

  const [openGroups, setOpenGroups] = useState({[unfilteredGroups[0]?.label]: true});
  const toggleGroup = id => setOpenGroups({...openGroups, [id]: !openGroups[id]});
  // Open first group.
  useEffect(() => {
    if (unfilteredGroups.length > 0) {
      setOpenGroups({
        [unfilteredGroups[0].label]: true,
      });
    }
  }, [unfilteredGroups]);

  const [
    {
      theme,
      defaultValues,
      history,
      future,
    },
    dispatch,
  ] = useThemeEditor({allVars});

  const frameRef = useRef(null);
  const settings = useGlobalSettings(frameRef);
  const {
    propertyFilter,
    propertySearch,
    fileName,
    isResponsive, setResponsive,
    isSimpleSizes,
    useDefaultsPalette, setUseDefaultsPalette,
    nativeColorPicker, setNativeColorPicker,
  } = settings;

  // Don't move to settings yet, hiding and showing of panels probably needs a different solution.
  const [importCollapsed, setImportCollapsed] = useState(true);
  const [serverThemesCollapsed, setServerThemesCollapsed] = useLocalStorage('server-themes-collapsed', true);
  const [sheetsDisablerCollapsed, setSheetDisablerCollapsed] = useState(true);

  const groups = useMemo(() => {
    const searched = filterSearched(unfilteredGroups, propertySearch);
    if (propertyFilter === 'all') {
      return searched;
    }
    return searched.map(group => ({
      ...group,
      vars: group.vars.filter(cssVar => cssVar.usages.some(usage => isColorProperty(usage.property)))
    }));
  }, [unfilteredGroups, propertyFilter, propertySearch]);

  const screenOptions = isSimpleSizes ? simpleScreenOptions : allScreenOptions;

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
    serverThemesLoading,
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

  const colorUsages = useMemo(
    () => extractColorUsages(theme, !useDefaultsPalette ? {} : defaultValues).sort(byHexValue),
    [theme, defaultValues, useDefaultsPalette],
  );

  return <ThemeEditorContext.Provider value={{
    theme,
    dispatch,
    defaultValues,
    frameRef,
    screenOptions,
    serverThemes,
    serverThemesLoading,
    uploadTheme,
    deleteTheme,
    existsOnServer,
    modifiedServerVersion,
    colorUsages,
    setSheetDisablerCollapsed,
    ...settings,
  }}>
    <div className="theme-editor">
      {!!isResponsive && <ResizableFrame src={window.location.href}/>}

      <div className={'theme-editor-menu'}>
        <ToggleButton controls={[importCollapsed, setImportCollapsed]}>
          Import/export
        </ToggleButton>
        <ToggleButton controls={[sheetsDisablerCollapsed, setSheetDisablerCollapsed]}>
          Stylesheets
        </ToggleButton>
        <ToggleButton controls={[serverThemesCollapsed, setServerThemesCollapsed]}>
          Server
        </ToggleButton>
        <Checkbox controls={[isResponsive, setResponsive]}>
          Responsive view
        </Checkbox>
      </div>
      {!sheetsDisablerCollapsed && <StylesheetDisabler/>}

      {!importCollapsed && <ImportExportTools/>}

      <ThemeUploadPanel/>

      {!serverThemesCollapsed && <ServerThemesList/>}

      <div style={{display: 'flex', gap: '4px'}}>
        <Checkbox controls={[useDefaultsPalette, setUseDefaultsPalette]}>
          Include default palette
        </Checkbox>
        <Checkbox controls={[nativeColorPicker, setNativeColorPicker]}>
          Native color picker
        </Checkbox>
      </div>
      <CustomVariableInput/>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        width: 'var(--theme-editor--ul--width, 360px)',
      }}>
        <PropertyCategoryFilter/>
        <PropertySearch/>
        <div>
          <HistoryBack {...{history}}/>
          <HistoryForward {...{future}}/>
        </div>
      </div>

      <ul className={'group-list'}>
        {groups.map(group => <GroupControl key={group.label} {...{group, toggleGroup, openGroups}} />)}
      </ul>
    </div>
  </ThemeEditorContext.Provider>;
};
