import React, {useContext, useEffect} from 'react';
import {useLocalStorage} from '../../hooks/useLocalStorage';
import {ThemeEditorContext} from '../ThemeEditor';

const useDisabledStyleSheets = (disabledSheets, frameRef) => {

  useEffect(() => {
    [...document.styleSheets].forEach(sheet => {
      sheet.disabled = !!disabledSheets[sheet.href];
    });
    frameRef.current?.contentWindow.postMessage({
      type: 'set-sheet-config',
      payload: JSON.stringify(disabledSheets),
    });
  }, [disabledSheets]);
};

export const StylesheetDisabler = () => {
  const {
    frameRef,
    setSheetDisablerDisplayed,
  } = useContext(ThemeEditorContext);
  const [disabledSheets, setDisabledSheets] = useLocalStorage('set-disabled-sheets', {});

  const sheets = [...document.styleSheets].filter(({href}) => !!href);
  useDisabledStyleSheets(disabledSheets, frameRef);

  if (sheets === null) {
    return <div>Loading...</div>;
  }

  return <div
    style={{
      background: 'white',
      color: 'black',
      border: '1px solid black',
      borderRadius: '6px',
      padding: '5px',
    }}
  >
    <button
      style={{float: 'right'}}
      onClick={() => setSheetDisablerDisplayed(false)}
    >Close</button>
    <p>The following stylesheets are loaded on the page in the same order as they are shown.</p>
    <p>If you uncheck one it is disabled <b>while in the editor</b>.</p>
    <ul
      style={{
        paddingLeft: '3px',
        listStyleType: 'none',
      }}
    >{sheets.map(({href}) => {
        const id = href.replace(/\?.*/, '');

        const path = id.replace(window.location.origin, '');
        const parts = path.split('/');
        const firstParts = parts.slice(0, -1) || [];

        return <li
          key={href}
          style={{
            fontSize: '14px',
            marginBottom: '8px',
            wordBreak: 'break-all',
          }}
          onClick={() => {
            setDisabledSheets({...disabledSheets, [id]: !disabledSheets[id] || null});
          }}
        >
          <input readOnly type="checkbox" checked={!disabledSheets[id]}/>
          {firstParts.join('/')}/<b>{parts.at(-1)}</b>
        </li>;
      })}</ul>
  </div>;
};
