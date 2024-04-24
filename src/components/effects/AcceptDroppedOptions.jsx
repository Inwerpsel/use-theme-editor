import { useEffect } from "react";
import { ACTIONS, editTheme } from "../../hooks/useThemeEditor";

export function AcceptDroppedOptions() {
  const dispatch = editTheme();

  useEffect(() => {
    window.addEventListener(
      'message',
      (event) => {
        if (event.data.type === 'dropped-options') {
          const { options, value } = event.data.payload;
          const [firstOption, ...otherOptions] = options;
          dispatch({
            type: ACTIONS.set,
            payload: {
              name: firstOption.varName,
              scope: firstOption.scope,
              value,
              alternatives: otherOptions,
            },
          });
        }
      },
      false
    );
    // No cleanup needed, component doesn't dismount.
  }, []);

  return null;
}