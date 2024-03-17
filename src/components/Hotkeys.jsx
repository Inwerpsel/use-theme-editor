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
    const message = {
      type: 'theme-edit-alt-click',
      payload: { frameClickBehavior },
    };
    frameRef.current.contentWindow.postMessage(message, window.location.origin);
    setTimeout(() => {
      frameRef.current.contentWindow.postMessage(message, window.location.origin);
      // With current setup, it might take some time before the listener is added in the frame.
    }, 1000);
  }, [frameClickBehavior]);

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
