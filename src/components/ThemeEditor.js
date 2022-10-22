import React, {createContext, Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {ACTIONS, ROOT_SCOPE, useThemeEditor} from '../hooks/useThemeEditor';
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
import { RemoveAnnoyingPrefix } from './inspector/RemoveAnnoyingPrefix';
import { NameReplacements } from './inspector/NameReplacements';
import { updateScopedVars } from '../initializeThemeEditor';
import { UseEventExample } from './controls/SelectControl';

const hotkeysOptions = {
  enableOnTags: ['INPUT', 'SELECT', 'RADIO'],
};

export const ThemeEditorContext = createContext({});

export const ThemeEditor = (props) => {
  const {
    config,
    groups: unfilteredGroups,
    allVars,
    lastInspectTime,
  } = props;

  const [openGroups, setOpenGroups] = useState({});
  const toggleGroup = id => setOpenGroups({...openGroups, [id]: !openGroups[id]});
  // Open first group.
  useLayoutEffect(() => {
    if (openFirstOnInspect && unfilteredGroups.length > 0) {
      setOpenGroups({
        [unfilteredGroups[0].label]: true,
      });
    }
  }, [unfilteredGroups, openFirstOnInspect]);

  const [
    {
      defaultValues,
      history,
      future,
      scopes,
      changeRequiresReset,
    },
    dispatch,
  ] = useThemeEditor({allVars});

  const frameRef = useRef(null);
  const settings = useGlobalSettings(frameRef);

  useLayoutEffect(() => {
    updateScopedVars(scopes, changeRequiresReset);
  }, [scopes]);

  useEffect(() => {
    if (!frameRef.current) {
      console.log('Frameref not ready')
      return;
    }
    
    frameRef.current.contentWindow.postMessage(
      {
        type: 'set-scopes-styles',
        payload: { scopes, resetAll: changeRequiresReset },
      },
      window.location.origin,
      );
  }, [scopes]);

  const {
    propertyFilter,
    propertySearch,
    fileName,
    isSimpleSizes,
    useDefaultsPalette, setUseDefaultsPalette,
    nativeColorPicker, setNativeColorPicker,
    showCssProperties, setShowCssProperties,
    showSourceLinks, setShowSourceLinks,
  } = settings;

  // Don't move to settings yet, hiding and showing of panels probably needs a different solution.
  const [importCollapsed, setImportCollapsed] = useState(true);
  const [serverThemesCollapsed, setServerThemesCollapsed] = useLocalStorage('server-themes-collapsed', true);
  const [sheetsDisablerCollapsed, setSheetDisablerCollapsed] = useState(true);
  const [openFirstOnInspect, setOpenFirstOnInspect] = useLocalStorage('open-first-inspect', true);

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
    return existsOnServer && JSON.stringify(scopes) !== JSON.stringify(serverThemes[fileName].scopes);
  }, [serverThemes, fileName, scopes]);

  useHotkeys('alt+s', () => {
    if (fileName && fileName !== 'default' && modifiedServerVersion) {
      uploadTheme(fileName, scopes);
    }
  },hotkeysOptions, [fileName, modifiedServerVersion, scopes]);

  const colorUsages = useMemo(
    () => extractColorUsages(scopes[ROOT_SCOPE], !useDefaultsPalette ? {} : defaultValues).sort(byHexValue),
    [scopes, defaultValues, useDefaultsPalette],
  );

  return (
    <ThemeEditorContext.Provider
      value={{
        allVars,
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
        scopes,
        lastInspectTime,
        ...settings,
      }}
    >
      <div className="theme-editor">
        <MovablePanels>
          <div
            style={{
              display: 'flex',
              columns: 2,
              justifyContent: 'space-between',
            }}
          >
            <Area
              id="area-top"
              style={{ justifyContent: 'flex-start', flexGrow: 1 }}
            >
              <FrameSizeSettings />
              <ScreenSwitcher />
              <MoveControls />
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
                <ToggleButton controls={[importCollapsed, setImportCollapsed]}>
                  Import/export
                </ToggleButton>
                <ToggleButton controls={[sheetsDisablerCollapsed, setSheetDisablerCollapsed]}>
                  Stylesheets
                </ToggleButton>
                <ToggleButton controls={[serverThemesCollapsed, setServerThemesCollapsed]}>
                  Server
                </ToggleButton>
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
                {groups.length === 0 && <li><span className='alert'>No results</span></li>}
                {groups.map((group, index) => {
                  // const index = groups.length - 1 - indexNormal;
                  // const group = groups[index];
                  return (
                    <GroupControl
                      key={group.label}
                      {...{ group, toggleGroup, openGroups, index }} />
                  );
                })}
              </ul>
            </Area>
            <ResizableFrame src={window.location.href} />
            <Area id="area-right">
              <div>{!sheetsDisablerCollapsed && <StylesheetDisabler />}</div>
              <div>{!importCollapsed && <ImportExportTools />}</div>
            </Area>
          </div>
          <div
            style={{
              display: 'flex',
              columns: 2,
              justifyContent: 'space-between',
              flexGrow: 0,
              alignItems: 'flex-end',
            }}
          >
            <Area id="area-bottom"></Area>
            <Area
              id="area-bottom-reverse"
              style={{
                flexDirection: 'row-reverse',
              }}
            ></Area>
            <Drawer>
              <ThemeEditorExtraOptions />
              <RemoveAnnoyingPrefix />
              <div style={{display: 'flex', gap: '4px'}}>
                <Checkbox
                  id={'remove-css-properties'}
                  controls={[showCssProperties, setShowCssProperties]}
                >Show CSS properties</Checkbox>
                <Checkbox
                  id={'show-source-links'}
                  controls={[showSourceLinks, setShowSourceLinks]}
                >Show source links</Checkbox>
              </div>
              {/* <ExampleTabs/> */}
              <NameReplacements/>
              <div style={{display: 'flex', gap: '4px'}}>
                <Checkbox
                  id={'remove-css-properties'}
                  controls={[openFirstOnInspect, setOpenFirstOnInspect]}
                >Auto open first group on inspect</Checkbox>
              </div>
            </Drawer>
          </div>
        </MovablePanels>
      </div>
    </ThemeEditorContext.Provider>
  );
};
