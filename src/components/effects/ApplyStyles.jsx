import { useContext, useEffect, useInsertionEffect } from "react";
import { get } from "../../state";
import { updateScopedVars } from "../../initializeThemeEditor";
import { ThemeEditorContext } from "../ThemeEditor";

export function ApplyStyles() {
    const {themeEditor: {scopes}} = get;
    const {
      frameRef,
      scrollFrameRef,
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
    }, [scopes]);

    return null;
}