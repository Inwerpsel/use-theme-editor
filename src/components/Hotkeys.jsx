import { useEffect, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { get, use } from '../state';
import { flipDebugMode } from './RenderInfo';

export const hotkeysOptions = {
  enableOnTags: ['INPUT', 'SELECT', 'RADIO'],
};

// The hotkeys code is a bit old, I just moved it here to improve performance (it started being the only render trigger).
// Ideally I want to add hotkeys with more flexibility and without dependency arrays.
export function Hotkeys(props) {
  const { modifiedServerVersion, scopes, uploadTheme, frameRef } = props;
  const { fileName } = get;

  useHotkeys(
    'alt+r',
    flipDebugMode,
    []
  );

  useHotkeys(
    'alt+s',
    () => {
      if (fileName && fileName !== 'default' && modifiedServerVersion) {
        uploadTheme(fileName, scopes);
      }
    },
    hotkeysOptions,
    [fileName, modifiedServerVersion, scopes]
  );
  const [frameClickBehavior, setFrameClickBehavior] = use.frameClickBehavior();
  useHotkeys(
    'alt+a',
    () => {
      setFrameClickBehavior((value) => (value === 'alt' ? 'any' : 'alt'));
    },
    [frameClickBehavior]
  );
  useEffect(() => {
    if (!frameRef?.current) {
      return;
    }
    const message = {
      type: 'theme-edit-alt-click',
      payload: { frameClickBehavior },
    };
    frameRef.current.contentWindow.postMessage(message, window.location.origin);
  }, [frameClickBehavior, frameRef.current]);

  return null;
}

function hotkey(keys, hook, updater = (v) => !v) {
  const [value, setValue] = hook();
  useHotkeys(
    keys,
    () => {
      setValue(updater(value));
    },
    [value]
  );
}
