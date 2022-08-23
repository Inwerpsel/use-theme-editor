import React, {createContext, Fragment, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {ACTIONS, useThemeEditor} from '../hooks/useThemeEditor';
import {useLocalStorage} from '../hooks/useLocalStorage';
import {useHotkeys} from 'react-hotkeys-hook';
import {useServerThemes} from '../hooks/useServerThemes';
import {diffThemes} from '../functions/diffThemes';
import {ResizableFrame} from './ResizableFrame';
import {ServerThemesList} from './ui/ServerThemesList';
import {GroupControl} from './inspector/GroupControl';
import {CustomVariableInput} from './ui/CustomVariableInput';
import {StylesheetDisabler} from './ui/StylesheetDisabler';
import {allScreenOptions, simpleScreenOptions} from '../screenOptions';
import {PropertyCategoryFilter} from './ui/PropertyCategoryFilter';
import {isColorProperty} from './inspector/TypedControl';
import {PropertySearch} from './ui/PropertySearch';
import {filterSearched} from '../functions/filterSearched';
import {flipDebugMode} from './RenderInfo';
import {byHexValue, extractColorUsages} from './properties/ColorControl';
import {Checkbox} from './controls/Checkbox';
import {ToggleButton} from './controls/ToggleButton';
import {ImportExportTools} from './ui/ImportExportTools';
import {ThemeUploadPanel} from './ui/ThemeUploadPanel';
import {HistoryBack} from './ui/HistoryBack';
import {HistoryForward} from './ui/HistoryForward';
import {useGlobalSettings} from '../hooks/useGlobalSettings';
import {MovablePanels} from './movable/MovablePanels';
import {FrameSizeSettings} from './ui/FrameSizeSettings';
import {ScreenSwitcher} from './ui/ScreenSwitcher';
import {ThemeEditorExtraOptions} from './ui/ThemeEditorExtraOptions';
import {MoveControls} from './movable/MoveControls';
import {Area} from './movable/Area';
import {FrameScaleSlider} from './ui/FrameScaleSlider';
import {Drawer} from './movable/Drawer';
import {CurrentTheme} from './ui/CurrentTheme';

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
  useLayoutEffect(() => {
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
    dispatch({type: ACTIONS.historyBackward});
  }, hotkeysOptions);

  useHotkeys('ctrl+shift+z,cmd+shift+z', () => {
    dispatch({type: ACTIONS.historyForward});
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
    allVars,
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
      <MovablePanels dragEnabled={settings.dragEnabled}>
        <div style={{display: 'flex', columns: 2, justifyContent: 'space-between'}}>
          <Area id="area-top" style={{justifyContent: 'flex-start', flexGrow: 1}}>
            <FrameSizeSettings/>
            <ScreenSwitcher/>
            <MoveControls/>
          </Area>
          <Area
            id="area-top-reverse"
            style={{
              flexDirection: 'row-reverse',
              justifyContent: 'flex-start',
              flexGrow: 1,
            }}
          >
            <FrameScaleSlider/>
          </Area>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', flexGrow: '1', gap: '16px'}}>
          <Area id="area-left">
            <div className={'theme-editor-menu'}>
              <ToggleButton controls={[importCollapsed, setImportCollapsed]}>Import/export</ToggleButton>
              <ToggleButton controls={[sheetsDisablerCollapsed, setSheetDisablerCollapsed]}>Stylesheets</ToggleButton>
              <ToggleButton controls={[serverThemesCollapsed, setServerThemesCollapsed]}>Server</ToggleButton>
            </div>
            <Fragment>
              {!serverThemesCollapsed && <ServerThemesList/>}
            </Fragment>
            <ThemeUploadPanel/>
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
            }}>
              <PropertyCategoryFilter/>
              <PropertySearch/>
              <div>
                <HistoryBack {...{history}}/>
                <HistoryForward {...{future}}/>
              </div>
            </div>
            <ul className={'group-list'}>
              {groups.map((group, index) => <GroupControl
              key={group.label}
              {...{group, toggleGroup, openGroups, index}} />
              )}
            </ul>
            <CurrentTheme/>
          </Area>
          <ResizableFrame src={window.location.href}/>
          <Area id="area-right">
            <div>
              {!sheetsDisablerCollapsed && <StylesheetDisabler/>}
            </div>
            <div>
              {!importCollapsed && <ImportExportTools/>}
            </div>
          </Area>
        </div>
        <div style={{display: 'flex', columns: 2, justifyContent: 'space-between', flexGrow: 0}}>
          <Area id="area-bottom"  style={{display: 'flex', justifyContent: 'flex-start', flexGrow: 1}}>
          </Area>
          <Area
            id="area-bottom-reverse"
            style={{
              display: 'flex',
              flexDirection: 'row-reverse',
              justifyContent: 'flex-start',
              flexGrow: 1,
            }}
          >
          </Area>
          <Drawer>
            <ThemeEditorExtraOptions/>
          </Drawer>
        </div>
      </MovablePanels>
    </div>
  </ThemeEditorContext.Provider>;
};
