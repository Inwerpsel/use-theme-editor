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
      minWidth: '22vw',
      background: 'white',
      color: 'black',
    }}
  >
    <ul
    >{sheets.map(({href}) => {
        const id = href.replace(/\?.*/, '');

        return <li
          style={{
            fontSize: '14px',
          }}
          onClick={() => {
            setDisabledSheets({...disabledSheets, [id]: !disabledSheets[id] || null});
          }}
        >
          <input type="checkbox" checked={!disabledSheets[id]}/>
          {id.replace(window.location.origin, '')}
        </li>;
      })}</ul>
  </div>;
};
