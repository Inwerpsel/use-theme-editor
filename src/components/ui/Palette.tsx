import React, { Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { PreviewValue } from "../inspector/VariableControl";
import { ThemeEditorContext } from "../ThemeEditor";
import { definedValues, scopesByProperty } from "../../functions/collectRuleVars";
import { ToggleButton } from "../controls/ToggleButton";
import { VariableUsages } from "../inspector/VariableUsages";
import { VariableReferences } from "../inspector/VariableReferences";
import { dragValue } from "../../functions/dragValue";
import { MovableElementContext, useCompactSetting } from "../movable/MovableElement";
import { CompactModeButton } from "../movable/CompactModeButton";
import { Tutorial } from "../../_unstable/Tutorial";

function PaletteEntry(props) {
  const {value, isHtml} = props;
  const varName = value.replace(/var\(/, '').replace(/\)$/, '').trim();
  const isVar = varName !== value && /^[\w\-]+$/.test(varName);
  const ref = useRef();

  useEffect(() => {
    if (!isHtml) return;


  }, [value]);

  if (isHtml) {
    return <div style={{pointerEvents: 'none'}} dangerouslySetInnerHTML={{__html: value}}/>
  }

  return (
    <div
      {...{ref}}
      style={{ listStyleType: 'none' }}
      draggable
      onDrag={(event) => {
        event.dataTransfer.setData('value', value);
        event.stopPropagation();
      }}
    >
      {isVar ? <Variable {...{value, varName}} /> : <RawValue {...{value}} />}
    </div>
  );
}

function RawValue(props) {
  // Always same.

  const {value} = props;
  const cssVar = {name: value, value, usages: []};

  return <div>
    <PreviewValue {...{ value, cssVar }} />
  </div>
}

function Variable(props) {
  // Context and history dependent: list all scopes and their value.

  // This list also changes throughout time.

  // When adding a variable that was recently created, going back in history
  // will cause it to be undefined.
  // Probably drag should be prevented when that occurs, as using it would
  // chop off the future and hence make you add an empty variable.
  // In case of a variable with no other references, it could be created
  // instead.

  const {value, varName} = props;

  const {
    allVars,
    scopes,
  } = useContext(ThemeEditorContext);

  const [showUsages, setShowUsages] = useState(false);

  const cssVar = allVars.find(v=>v.name === varName) || {name: varName, usages: []};
  const references = useMemo(() => {
    // Prevent much unneeded work on large lists.
    if (!showUsages) {
      return null;
    }
    if (!cssVar.name.startsWith('--')) {
      return [];
    }
    const regexp = new RegExp(
      `var\\(\\s*${cssVar.name.replaceAll(/-/g, "\\-")}[\\s\\,\\)]`
    );

    const currentValues = Object.values(scopes);
    const defaultValues = Object.values(definedValues);

    return allVars.filter(({ name }) => {
      if (!name.startsWith('--')) {
        return false;
      }

      const fromCurrentScope = currentValues.some(s=>s[name] && regexp.test(s[name]));
      if (fromCurrentScope) {
        return true;
      }
      return defaultValues.some((scope) => {
        const value = scope[name];
        return value && value.includes('--') && regexp.test(value)
      });
      // if (definedValues[name]) {
      //   return regexp.test(definedValues[name]);
      // }
      // return regexp.test(usages[0].defaultValue);
    });
  }, [scopes, showUsages]);

  const baseValues = Object.entries(scopesByProperty[varName] || {});
  let values;
  if (baseValues.length === 0) {
    const editorValues = [];
    for (const [selector, vars] of Object.entries(scopes)) {
      for (const [name, value] of Object.entries(vars)) {
        if (name === varName) {
          editorValues.push([selector, value]);
        }
      }
    }
    values = editorValues;
  } else {
    values = baseValues;
  }

  if (values.length === 0) {
    return <div>
      <b>{varName} <span style={{color: 'red'}}>is undefined</span></b>
    </div>
  }

  if (values.length === 1) {
    return <div>
      <b draggable onDragStart={dragValue(value)}>{varName}</b>
      <PreviewValue value={values[0][1]} {...{cssVar}}/>
      <ToggleButton controls={[showUsages, setShowUsages]}>Usages</ToggleButton>
      {showUsages && <Fragment>
        <VariableReferences {...{references}} />
        <VariableUsages {...cssVar}/>
        </Fragment>}
    </div>
  }

  return <div>
    <b draggable onDragStart={dragValue(value)}>{varName} ({values.length})</b>
    <ul>
      {values.map(([selector,v]) => <li key={selector} style={{clear: "both"}}>
        <span style={{float: "right"}} className="monospace-code">{selector}</span>
        <PreviewValue value={(selector in scopes && varName in scopes[selector]) ? scopes[selector][varName] : v} {...{cssVar}}/>
      </li>)}
    </ul>
  </div>
}

function MiniPalette({values, setValues}) {
  const [isVertical, setIsVertical] = useLocalStorage('palette-vertical', true);
  const [dragmode, setDragmode] = useState(false);

  useEffect(() => {
    if (dragmode) {
      const listener = () => {setDragmode(false);};
      document.addEventListener('drop', listener);
      document.addEventListener('dragend', listener);
      return () => {
        document.removeEventListener('drop', listener);
        document.removeEventListener('dragend', listener);
      }
    }
  }, [dragmode]);
  
  useEffect(() => {
    setDragmode(false);
  }, [values])

  return <div
    style={{display: 'flex', flexDirection: isVertical ? 'column' : 'row'}}
  >
    {dragmode && <div 
      style={{fontSize: '25px', fontWeight: 'bold', textAlign: 'center', border: '1px dashed grey', minWidth: '35px'}}
      onDrop={(event) => {
        const toRemove = event.dataTransfer.getData('value');
        if (toRemove === undefined) {
          return;
        }
        setValues(values.filter(({ value: v }) => v !== toRemove));
      } }
    >🗑</div>}
    {!dragmode && <ToggleButton controls={[isVertical, setIsVertical]}>{isVertical ? '⇓' : '⇒'}</ToggleButton>}
    {values.map(({ value, isHtml }) => {
      // This doesn't really serve a purpose, but it's interesting to see how the browser treats the styles,
      // when copying fragments of HTML to the clipboard.
      // Surprisingly, many things will still look proper and show the results of changes made in the editor.
      // The problem is many inline styles get added and will overrule things, and it's quite hard to know
      // which inline styles could be removed from the copied markup.
      if (isHtml) {
        return <div
          style={{
            width: '48px',
            height: '48px',
            overflow: 'hidden',
            background: 'white',
          }}
          draggable
          onDragStart={dragValue(value, () => setDragmode(true))}
        >
          <div style={{width: '320px', transform: 'scale(.3)', transformOrigin: 'left top'}} dangerouslySetInnerHTML={{__html: value}}/>
        </div>;
      }

      return (
        <span>
          <span
            key={value}
            draggable
            onDragStart={dragValue(value, () => setDragmode(true))}
            title={value}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              margin: '2px',
              backgroundImage: `${value}`,
              backgroundColor: value,
              backgroundRepeat: `no-repeat`,
              backgroundSize: 'cover',
              fontSize: '14px',
              textShadow: 'white 0px 10px',
              width: '48px',
              height: '48px',
            }}
          >
            {value}
          </span>
          {/* {isVertical && <button
            style={{ verticalAlign: 'top' }}
          >
            X
          </button>} */}

        </span>
      );
    })}
  </div>
}

function MaxiPalette({values, setValues}) {
  return <ul style={{ display: 'flex', flexDirection: 'column', maxWidth: '320px' }}>
        {values.map((entry) => {
          const { value } = entry;

          return (
            <li
              key={value}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
              }}
            >
              <PaletteEntry {...entry} />
              <button
                style={{ alignSelf: 'flex-end' }}
                onClick={() => {
                  setValues(values.filter((v) => v !== entry));
                }}
              >
                X
              </button>
            </li>
          );
        })}
      </ul>
}

export function Palette() {
    const [values, setValues] = useLocalStorage('palette', []);
    const [compact] = useCompactSetting();

    return (
      <div
        // onDragEnter={preventDefault}
        onDragOver={(event) => {
          if (
            !values.some(
              ({ value }) => value === event.dataTransfer.getData('value')
            )
          ) {
            event.preventDefault();
          }
        }}
        onDrop={(event) => {
          let isHtml = false, value = event.dataTransfer.getData('value');
          if (value === '') {
            value = event.dataTransfer.getData('text/html').trim();
            isHtml = true;
          }
          if (value === '') {
            value = event.dataTransfer.getData('text/plain').trim();
          }
          if (
            !values.some(
              ({ value }) => value === event.dataTransfer.getData('value')
            )
          ) {
            setValues([...values, { value, isHtml }]);
          }

          event.stopPropagation();
        }}
      >
        <CompactModeButton />
        <br/>
        {values.length === 0 && <span>Empty<br/></span>}
        {compact ? <MiniPalette {...{values, setValues}}/> : <MaxiPalette  {...{values, setValues}}/>}
        <Tutorial el={Palette} tasks={[
          () => [`Add 2 items to the palette (${Math.min(2, values.length)}/2)`, values.length > 1],
        ]}>
          You can drop values here and drag them onto the page and UI elements.
          </Tutorial>
      </div>
    );
}

Palette.fName = 'Palette';