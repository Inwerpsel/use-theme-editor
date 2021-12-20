import {useEffect, useState} from 'react';
import {useLocalStorage} from '../hooks/useLocalStorage';

const useSameOriginStylesheets = () => {
  const [sheets, setSheets] = useState(null);

  useEffect(() => {
    const nonInlineSheets = [...document.styleSheets].filter(({href}) => href && href.includes(window.location.origin));
    setSheets(nonInlineSheets);
  }, []);

  return sheets;
};

const useDisabledStyleSheets = (disabledSheets, frameRef) => {

  useEffect(() => {
    [...document.styleSheets].forEach(sheet => {
      sheet.disabled = !!disabledSheets[sheet.href];
    });
    frameRef.current && frameRef.current.contentWindow.postMessage({
      type: 'set-sheet-config',
      payload: JSON.stringify(disabledSheets),
    });
  }, [disabledSheets, frameRef]);
};

export const StylesheetDisabler = props => {
  const {frameRef, collapsed} = props;
  const [disabledSheets, setDisabledSheets] = useLocalStorage('set-disabled-sheets', {});

  const sheets = useSameOriginStylesheets();
  useDisabledStyleSheets(disabledSheets, frameRef);

  if (collapsed) {
    return null;
  }

  if (sheets === null) {
    return <div>Loading...</div>;
  }

  return <div
    style={{
      position: 'fixed',
      left: '0',
      minWidth: '28vw',
      background: 'white',
      color: 'black',
      zIndex: 1010,
      border: '1px solid black',
      borderRadius: '6px',
    }}
  >
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
          style={{
            fontSize: '14px',
            marginBottom: '8px',
          }}
          onClick={() => {
            setDisabledSheets({...disabledSheets, [id]: !disabledSheets[id] || null});
          }}
        >
          <input type="checkbox" checked={!disabledSheets[id]}/>
          {firstParts.join('/')}/<b>{parts.at(-1)}</b>
        </li>;
      })}</ul>
  </div>;
};
