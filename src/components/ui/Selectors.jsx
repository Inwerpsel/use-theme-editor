import { ElementLocator } from "./ElementLocator";
import { use } from "../../state";
import { Fragment, useRef, useState } from "react";

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
  const ref = useRef();
  const [showDropTargets, setShowDropTargets] = useState(false);
  return (
    <div
      // onDragEnter={(e) => {
      //   ref.current && clearTimeout(ref.current);
      //   setShowDropTargets(true);
      //   e.preventDefault();
      // }}
      // onDragLeave={(e) => {
      //   ref.current = setTimeout(() => {
      //     setShowDropTargets(false);
      //   }, 100);
      // }}
    >
      {/* <DropCombineSelector {...{ selector, add, shown: showDropTargets }} /> */}
      <button style={{ float: 'right' }} onClick={() => remove(selector)}>
        -
      </button>
      <ElementLocator {...{ selector, allowScroll: true, allowDrag: false }} />
    </div>
  );
}

export function Selectors() {
    // Todo: support set in local storage.
    const [selectors, setSelectors] = use.savedSelectors();

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

    return (
      <div
        onDragOver={e=>e.preventDefault()}
        onDrop={(e) => {
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
        }}
      >
        {selectors.length === 0 && <h2>Drop selectors here</h2>}
        <ul>
          {selectors.map((selector) => (
            <li style={{ position: 'relative' }} key={selector}>
              <Selector {...{selector, add, remove}}/>
            </li>
          ))}
        </ul>
      </div>
    );
}

Selectors.fName = 'Selectors';