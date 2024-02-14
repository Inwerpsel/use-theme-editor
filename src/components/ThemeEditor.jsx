import React, {createContext, Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {ACTIONS, useThemeEditor} from '../hooks/useThemeEditor';
import {useLocalStorage, useResumableLocalStorage} from '../hooks/useLocalStorage';
import {useServerThemes} from '../hooks/useServerThemes';
import {ResizableFrame} from './ResizableFrame';
import {ServerThemesList} from './ui/ServerThemesList';
import {CustomVariableInput} from './ui/CustomVariableInput';
import {StylesheetDisabler} from './ui/StylesheetDisabler';
import {PropertyCategoryFilter} from './ui/PropertyCategoryFilter';
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
import { VoiceCommands } from './ui/VoiceCommands';
import { SpeakGlobalHooks } from '../voice/menu/state';
import { HistoryVisualization } from './ui/HistoryVisualization';

export const ThemeEditorContext = createContext({});

export const prevGroups = [];

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

  const [currentInspected, setCurrentInspected] = useResumableLocalStorage('inspected-index', -1);
  const unfilteredGroups = currentInspected === -1 ? [] : prevGroups[currentInspected] || _unfilteredGroups;
  const [openGroups, setOpenGroups] = useResumableLocalStorage('OPEN_GROUPS', {});
  
  const frameRef = useRef(null);
  const scrollFrameRef = useRef(null);

  // Don't move out along with similar global state, hiding and showing of panels probably needs a different solution.
  const [importDisplayed, setImportDisplayed] = useState(false);
  const [serverThemesDisplayed, setServerThemesDisplayed] = useLocalStorage('server-themes-displayed', true);
  const [sheetsDisablerDisplayed, setSheetDisablerDisplayed] = useState(false);

  const [openFirstOnInspect, setOpenFirstOnInspect] = useLocalStorage('open-first-inspect', false);
  const [fullPagePreview, setFullPagePreview] = useLocalStorage('full-page-preview', false)

  const [
    {
      scopes,
    },
    dispatch,
  ] = useThemeEditor({allVars, defaultValues});

  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'dropped-options') {
        const {options, value} = event.data.payload;
        console.log(options, value)
        const [firstOption, ...otherOptions] = options;
        dispatch({
          type: ACTIONS.set,
          payload: { name: firstOption.varName, scope: firstOption.scope, value, alternatives: otherOptions },
        });
      }
    }, false);
    // No cleanup needed, component doesn't dismount.
  }, []);

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


  useLayoutEffect(() => {
    if (currentInspected !== -1 && currentInspected <= inspectedIndex) {
      frameRef.current?.contentWindow.postMessage(
        {
          type: 'inspect-previous',
          payload: { index: currentInspected },
        },
        window.location.origin
      );    
    }
  }, [currentInspected, prevGroups.length === 0]);

  useLayoutEffect(() => {
    if ( isNewInspection ) {
      prevGroups[inspectedIndex] = _unfilteredGroups;
      setCurrentInspected(inspectedIndex);
    } 
  }, [inspectedIndex]);

  // Open first group.
  // I don't like how this is done but it's tricky to replace at the moment.
  useLayoutEffect(() => {
    if (isNewInspection && currentInspected === inspectedIndex && openFirstOnInspect && unfilteredGroups.length > 0) {
      setOpenGroups(
        {
          [unfilteredGroups[0].label]: true,
        },
        { skipHistory: true }
      );
    }
  }, [unfilteredGroups, openFirstOnInspect, currentInspected, inspectedIndex, isNewInspection]);

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
      {/* <SpeakGlobalHooks hooks={use} /> */}
      <Hotkeys {...{modifiedServerVersion, scopes, uploadTheme, frameRef}}/>
      <div className="theme-editor">
        <MovablePanels stateHook={use.uiLayout}>
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
              <HistoryControls />
              <FrameScaleSlider/>
            </Area>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', flexGrow: '1'}}>
            <Area id="area-left">
              <Inspector {...{unfilteredGroups, inspectedIndex, currentInspected}}/>
            </Area>
            <ResizableFrame src={window.location.href} />
            {!!fullPagePreview && <SmallFullHeightFrame src={window.location.href} />}
            
            <Area id="area-right">
              <HistoryVisualization />
              <ThemeUploadPanel/>
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
              <Fragment>
                {serverThemesDisplayed && <ServerThemesList/>}
              </Fragment>
              <Fragment>{sheetsDisablerDisplayed && <StylesheetDisabler />}</Fragment>
              <Fragment>{importDisplayed && <ImportExportTools />}</Fragment>

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
              <MoveControls />
              <CustomVariableInput/>
              <FrameSizeSettings />
              <ThemeEditorExtraOptions />
              <RemoveAnnoyingPrefix />
              <NameReplacements/>
              <SignalExample />
              {/* <VoiceCommands /> */}
              <CurrentTheme />
            </Drawer>
          </div>
        </MovablePanels>
      </div>
    </ThemeEditorContext.Provider>
  );
};
