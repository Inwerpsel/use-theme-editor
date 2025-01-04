import { ElementLocator } from "./ElementLocator";
import { use } from "../../state";
import { useContext, useMemo, useState } from "react";
import { ToggleButton } from "../controls/ToggleButton";
import { TextControl } from "../controls/TextControl";
import { ThemeEditorContext } from "../ThemeEditor";
import { useLocalStorage } from "../../hooks/useLocalStorage";

// let isCaptureMode = false, params = {};

// function param(name) {
//   if (isCaptureMode) {
//     // Record that there is a param, so we can show input for it.
//     params[name] = null;
//   } else {
//     return params[name];
//   }
// }

// function captureParams(snippet) {
//   params = {};
//   isCaptureMode = true;

//   snippet();

//   isCaptureMode = false;
//   return params;
// }

// function evaluateParams(snippet, p) {
//   params = p;
// }

// const snippets = {
//   'Elements with inline style': () => `[style]`,
//   'Elements with inline custom properties': () => `[style*=--]`,
//   'Elements with a specific inline custom property': ({name}) => `[style*=${name}:]`,
// };

// function SnippetUI() {
//   return <div>
//     {snippets.map((snippet) => {
//       const params = captureParams(snippet);
//       return <div></div>;
//     })}
//   </div>
// }

function DropAction({ onDrop, children }) {
  return (
    <div
      style={{ textAlign: 'center', fontSize: '2rem',padding: '8px', background: 'yellow'}}
      {...{onDrop}}
    >
      {children}
    </div>
  );
}

function DropCombineSelector({selector, add, shown}) {
  if (!shown) {
    return null;
  }

  return (
    <div
      className="stretch-over-parent flex-row"
      style={{ justifyContent: 'flex-end'}}
    >
      <DropAction
        onDrop={(e) => {
          const droppedSelector = e.dataTransfer.getData('selector');
          if (!droppedSelector) return;
          add(`:where(${selector}):not(${droppedSelector})`);
        }}
      >
        Not
      </DropAction>
      <DropAction
        onDrop={(e) => {
          const droppedSelector = e.dataTransfer.getData('selector');
          if (!droppedSelector) return;
          add(`:where(${selector}):where(${droppedSelector})`);
        }}
      >
        And
      </DropAction>
    </div>
  );
}

function Selector({ selector, add, remove }) {
  // const ref = useRef();
  const [showDropTargets, setShowDropTargets] = useState(false);
  return (
    <div
      style={{display: 'flex', justifyContent: 'space-between'}}
      // onDragEnter={(e) => {
      //   setShowDropTargets(true);
      //   ref.current && clearTimeout(ref.current);
      //   ref.current = setTimeout(() => {
      //     setShowDropTargets(true);
      //   }, 20);
      //   e.preventDefault();
      // }}
      // onDragLeave={(e) => {
      //   // ref.current && clearTimeout(ref.current);
      //   setShowDropTargets(false);
      //   // ref.current = setTimeout(() => {
      //   //   setShowDropTargets(false);
      //   // }, 20);
      // }}
    >
      <DropCombineSelector {...{ selector, add, shown: showDropTargets }} />
      <ElementLocator {...{ selector, allowScroll: true, allowDrag: false }} />
      <button style={{alignSelf: 'flex-start'}} onClick={() => remove(selector)}>
        -
      </button>
    </div>
  );
}

export function Selectors() {
    // Todo: support Set in local storage.
    const [selectors, setSelectors] = use.savedSelectors();
    const { frameRef } = useContext(ThemeEditorContext);

    const [open, setOpen] = useLocalStorage('showSelectorsWidget', true);
    const [addMode, setAddMode] = useState(false);
    const [newSelector, setNewSelector] = useState('');

    const [isValid, amount] = useMemo(() => {
      try {
        return [true, frameRef.current?.contentWindow.document.querySelectorAll(newSelector).length]
      } catch (e) {
        // console.log(e);
        return [false];
      }
    }, [newSelector])

    function add(selector) {
        if (selectors.includes(selector)) {
            return;
        }
        setSelectors([...selectors, selector]);
    }

    function remove(selector) {
        if (!selectors.includes(selector)) {
            return;
        }
        setSelectors(selectors.filter(s=>s!==selector));
    }
    const onDrop = (e) => {
      const text = e.dataTransfer.getData('text/plain').trim();
      try {
        // if ((text?.trim() || '') === '') throw new Error('hmm');
        document.querySelector(text);
        add(text);
      } catch (err) {
        const selector = e.dataTransfer.getData('selector');
        if (selector) {
          add(selector);
        }
      }
    }

    if (!open) {
      return <button
        onDragOver={e=>e.preventDefault()}
        onDrop={(e) => {
          onDrop(e);
          setOpen(true);
        }}
        onClick={() => {setOpen(true)}}
      >Selectors...</button>
    }

    return (
      <div
        onDragOver={e=>e.preventDefault()}
        {...{onDrop}}
      >
        {selectors.length === 0 && <h2>Drop selectors here</h2>}
        <ul>
          {selectors.map((selector) => (
            <li style={{ position: 'relative' }} key={selector}>
              <Selector {...{selector, add, remove}}/>
            </li>
          ))}
        </ul>
        <button onClick={() => {setOpen(false)}}>Close</button>
        <ToggleButton controls={[addMode, setAddMode]}>New...</ToggleButton>
        {addMode && <div>
          <TextControl {...{value: newSelector, onChange: setNewSelector}} />
          <button {...{disabled: newSelector === '', onClick: () => {add(newSelector)}}}>Add</button>
          {isValid && <span>Found {amount}</span>}
        </div>}
      </div>
    );
}

Selectors.fName = 'Selectors';