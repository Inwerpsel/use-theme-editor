import React, {createContext, Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {ROOT_SCOPE, useThemeEditor} from '../hooks/useThemeEditor';
import {useLocalStorage} from '../hooks/useLocalStorage';
import {useServerThemes} from '../hooks/useServerThemes';
import {ResizableFrame} from './ResizableFrame';
import {ServerThemesList} from './ui/ServerThemesList';
import {CustomVariableInput} from './ui/CustomVariableInput';
import {StylesheetDisabler} from './ui/StylesheetDisabler';
import {PropertyCategoryFilter} from './ui/PropertyCategoryFilter';
import {isColorProperty} from './inspector/TypedControl';
import {PropertySearch} from './ui/PropertySearch';
import {Checkbox} from './controls/Checkbox';
import {ToggleButton} from './controls/ToggleButton';
import {ImportExportTools} from './ui/ImportExportTools';
import {ThemeUploadPanel} from './ui/ThemeUploadPanel';
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
import { HistoryControls } from './ui/HistoryControls';
import { useResumableState } from '../hooks/useResumableReducer';
import { useInsertionEffect } from 'react';
import { SmallFullHeightFrame } from './SmallFullHeightFrame';
import { Inspector } from './ui/Inspector';
import { get, use } from '../state';
import { Hotkeys } from './Hotkeys';
import { ColorSettings } from './ui/ColorSettings';
import { InformationVisibilitySettings } from './ui/InformationVisibilitySettings';
import { WebpackHomeInput } from './ui/WebpackHomeInput';
import { SignalExample } from './_examples/SignalExample';

export const ThemeEditorContext = createContext({});

export const prevGroups = [];

let prevOpengroups = null;

export const ThemeEditor = (props) => {
  const {
    config,
    groups: _unfilteredGroups,
    allVars,
    defaultValues,
    lastInspectTime,
    inspectedIndex,
    isNewInspection,
  } = props;

  const { fileName } = get;

  const [currentInspected, setCurrentInspected] = useResumableState(-1, 'inspected-index');
  const unfilteredGroups = prevGroups[currentInspected] || _unfilteredGroups;
  const [_openGroups, setOpenGroups] = useResumableState({}, 'OPEN_GROUPS');
  const openGroups = prevOpengroups !== null ? prevOpengroups : _openGroups;
  prevOpengroups = null;
  
  const frameRef = useRef(null);
  const scrollFrameRef = useRef(null);

  // Don't move to settings yet, hiding and showing of panels probably needs a different solution.
  const [importDisplayed, setImportDisplayed] = useState(false);
  const [serverThemesDisplayed, setServerThemesDisplayed] = useLocalStorage('server-themes-displayed', true);
  const [sheetsDisablerDisplayed, setSheetDisablerDisplayed] = useState(false);

  const [openFirstOnInspect, setOpenFirstOnInspect] = useLocalStorage('open-first-inspect', true);

  const [
    {
      scopes,
      // changeRequiresReset,
    },
    dispatch,
  ] = useThemeEditor({allVars, defaultValues});

  const {
    serverThemes,
    serverThemesLoading,
    uploadTheme,
    deleteTheme,
  } = useServerThemes(config.serverThemes);

  const existsOnServer = serverThemes && fileName in serverThemes;
  const modifiedServerVersion = useMemo(() => {
    return existsOnServer && JSON.stringify(scopes) !== JSON.stringify(serverThemes[fileName].scopes);
  }, [serverThemes[fileName]?.scopes, scopes]);

  const [fullPagePreview, setFullPagePreview] = useLocalStorage('full-page-preview', false)

  useLayoutEffect(() => {
    if (currentInspected !== -1 && currentInspected !== inspectedIndex) {
      // window.requestAnimationFrame(() => {
        frameRef.current?.contentWindow.postMessage(
          {
            type: 'inspect-previous',
            payload: { index: currentInspected },
          },
          window.location.origin
        );    
      // });
      prevOpengroups = openGroups;
    }
  }, [currentInspected]);

  useLayoutEffect(() => {
    if ( isNewInspection ) {
      prevGroups[inspectedIndex] = _unfilteredGroups;
      setCurrentInspected(inspectedIndex);
    } 
  }, [inspectedIndex]);

  // Open first group.
  // I don't like how this is done but it's tricky to replace at the moment.
  useLayoutEffect(() => {
    if (isNewInspection && openFirstOnInspect && unfilteredGroups.length > 0) {
      setOpenGroups(
        {
          [unfilteredGroups[0].label]: true,
        },
        { skipHistory: true }
      );
    }
  }, [unfilteredGroups, openFirstOnInspect]);

  useInsertionEffect(() => {
    updateScopedVars(scopes, true);
  }, [scopes]);

  useEffect(() => {
    frameRef.current.contentWindow.postMessage(
      {
        type: 'set-scopes-styles',
        payload: { scopes, resetAll: true },
      },
      window.location.origin,
      );
    
    scrollFrameRef.current?.contentWindow.postMessage(
      {
        type: 'set-scopes-styles',
        payload: { scopes, resetAll: true },
      },
      window.location.origin,
      );
  }, [scopes]);


  return (
    <ThemeEditorContext.Provider
      value={{
        allVars,
        dispatch,
        defaultValues,
        frameRef,
        scrollFrameRef,
        serverThemes,
        serverThemesLoading,
        uploadTheme,
        deleteTheme,
        existsOnServer,
        modifiedServerVersion,
        setSheetDisablerDisplayed,
        scopes,
        lastInspectTime,
        openGroups, setOpenGroups,
      }}
    >
      <Hotkeys {...{modifiedServerVersion, scopes, uploadTheme, frameRef}}/>
      <span>AAAAAAA</span>
      <div className="theme-editor">
        <MovablePanels stateHook={use.uiArrangement}>
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
              <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                }}>
                <PropertyCategoryFilter/>
                <PropertySearch/>
              </div>
              <ScreenSwitcher />
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
              <div className={'theme-editor-menu'}>
                <ToggleButton controls={[importDisplayed, setImportDisplayed]}>
                  Import/export
                </ToggleButton>
                <ToggleButton controls={[sheetsDisablerDisplayed, setSheetDisablerDisplayed]}>
                  Stylesheets
                </ToggleButton>
                <ToggleButton controls={[serverThemesDisplayed, setServerThemesDisplayed]}>
                  Server
                </ToggleButton>
              </div>
            </Area>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', flexGrow: '1', gap: '16px'}}>
            <Area id="area-left">
              <MoveControls />
              <Inspector {...{unfilteredGroups}}/>
            </Area>
            <ResizableFrame src={window.location.href} />
            {!!fullPagePreview && <SmallFullHeightFrame src={window.location.href} />}
            
            <Area id="area-right">
              <Fragment>
                {serverThemesDisplayed && <ServerThemesList/>}
              </Fragment>
              <Fragment>{sheetsDisablerDisplayed && <StylesheetDisabler />}</Fragment>
              <Fragment>{importDisplayed && <ImportExportTools />}</Fragment>

              <ThemeUploadPanel/>
              <InformationVisibilitySettings />
              <ColorSettings />
              <div>
                <Checkbox
                  // id={'full-page-preview'}
                  controls={[fullPagePreview, setFullPagePreview]}
                  title='This does not work properly for pages that have different styles based on screen height.'
                >Scroll preview</Checkbox>
                <Checkbox
                  // id={'open-first-on-inspect'}
                  controls={[openFirstOnInspect, setOpenFirstOnInspect]}
                >Auto open first group on inspect</Checkbox>
                <WebpackHomeInput />
              </div>
              <HistoryControls />
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
              <CustomVariableInput/>
              <FrameSizeSettings />
              <ThemeEditorExtraOptions />
              <RemoveAnnoyingPrefix />
              {/* <ExampleTabs/> */}
              <NameReplacements/>
              <SignalExample />
            </Drawer>
          </div>
        </MovablePanels>
      </div>
    </ThemeEditorContext.Provider>
  );
};
