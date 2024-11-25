import { useContext, useEffect, useInsertionEffect } from "react";
import { get } from "../../state";
import { updateScopedVars } from "../../initializeThemeEditor";
import { ThemeEditorContext } from "../ThemeEditor";

export function ApplyStyles() {
    const {themeEditor: {scopes}, frameLoaded} = get;
    const {
      frameRef,
      scrollFrameRef,
      xrayFrameRef,
    } = useContext(ThemeEditorContext);
  

    useInsertionEffect(() => {
      updateScopedVars(scopes, true);
    }, [scopes]);

    useEffect(() => {
      frameRef.current.contentWindow.postMessage(
        {
          type: 'set-scopes-styles',
          payload: { scopes, resetAll: true },
        },
        window.location.origin
      );

      scrollFrameRef.current?.contentWindow.postMessage(
        {
          type: 'set-scopes-styles',
          payload: { scopes, resetAll: true },
        },
        window.location.origin
      );
      xrayFrameRef.current?.contentWindow.postMessage(
        {
          type: 'set-scopes-styles',
          payload: { scopes, resetAll: true },
        },
        window.location.origin
      );
    }, [scopes, frameLoaded]);

    return null;
}