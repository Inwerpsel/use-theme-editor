import { useEffect, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { get, use } from '../state';
import { flipDebugMode } from './RenderInfo';

export const hotkeysOptions = {
  enableOnTags: ['INPUT', 'SELECT', 'RADIO'],
};

export function Hotkeys(props) {
  const {} = get;
  const { fileName, modifiedServerVersion, scopes, uploadTheme, frameRef } = props;

  useHotkeys(
    'alt+r',
    () => {
      flipDebugMode();
    },
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
