import React, { Fragment, useContext, useState } from 'react';
import { COLOR_VALUE_REGEX, GRADIENT_REGEX } from './components/properties/ColorControl';
import { SelectControl } from './components/controls/SelectControl';
import { Checkbox } from './components/controls/Checkbox';
import { ElementLocator } from './components/ui/ElementLocator';
import { dragValue } from './functions/dragValue';
import { FormatVariableName } from './components/inspector/VariableControl';
import { getGroupsForElement } from './initializeThemeEditor';
import { toNode } from './functions/nodePath';
import { ThemeEditorContext } from './components/ThemeEditor';
import { ScrollInViewButton } from './components/inspector/ScrollInViewButton';
import { otherUrls } from './hooks/useResumableReducer';
import { firstEntry } from './_unstable/historyStore';

const size = 18;

function FindOther({label}) {
  const [first, ...classes] = label.replace(/\s*\(\d\/\d\)$/, '').split('.').map(s=>s.trim());
  // const [name, id] = k.split('#').map(s=>s.trim());
  const [open, setOpen] = useState(false);

  return <Fragment>
    <Checkbox controls={[open, setOpen]}><div>{!open ? label : <span>close</span>}</div></Checkbox>
      {open && <Fragment>
        <ElementLocator selector={first} initialized showLabel />
        {classes.map(className => <ElementLocator selector={`.${className}`} initialized showLabel/>)}
      </Fragment>}
  </Fragment>
}

function Icon({children}) {
  return <span style={{fontSize: '1.5rem', minWidth: '2rem', display: 'inline-block', textAlign: 'center'}}>{children}</span>
}

export const icons = {
  uiLayout: <Icon>💻</Icon>,
  inspectedPath: <Icon>🔍</Icon>,
  themeEditor: <Icon>🖌</Icon>,
  scales: <Icon>🔬</Icon>,
  width: <Icon>↔</Icon>,
  height: <Icon>↕</Icon>,
  search: <Icon>🕵️</Icon>
};

export const previewComponents = {
  openGroups: ({ action: groups }) => {
    const items = Object.keys(groups);
    if (items.length === 0) return 'No open groups';
    return <div className='history-open-groups'>
      {items.reverse().map(label => <Fragment>
        <pre key={label} className="monospace-code" style={{ fontSize: '10px', display: 'inline-block' }}>
          <FindOther {...{ label }} />
        </pre>
      </Fragment>
      )}
    </div>;
  },

  inspectedPath: ({ action: path, historyIndex }) => {
    const {
      frameRef,
      // scrollFrameRef,
    } = useContext(ThemeEditorContext);

    let group;
    try {
      [group] = getGroupsForElement(toNode(path, frameRef.current.contentWindow.document));
    } catch (e) {
    }
    const isFromBeforeSession = historyIndex < firstEntry;

    const [url] = !isFromBeforeSession
      ? []
      : otherUrls.find(([, urlIndex]) => urlIndex <= historyIndex) || [];
    const link = !url ? null : (
      <a href={url}>{url.replace(/http:\/\/|https:\/\//, '')}</a>
    );
    if (!group) {
      if (link) return link;
      return '...';
    }
  
    const showLink = isFromBeforeSession && (url !== window.location.href);

    return (
      <Fragment>
        <ScrollInViewButton {...{path}} />
        <pre className="monospace-code">{group?.label}</pre>
        {showLink && link}
      </Fragment>
    );
  },

  themeEditor: {
    set: ({ payload: { scope, name, value, alternatives } }) => {
      
      return (
        <Fragment>
          {scope && <pre className="monospace-code">{scope}</pre>}
          <br />
          <b draggable onDragStart={dragValue(`var(${name})`)}><FormatVariableName {...{name}}/></b> <br />
          <span draggable onDragStart={dragValue(value)}>
            {(COLOR_VALUE_REGEX.test(value) ||
              GRADIENT_REGEX.test(value) ||
              /var\(/.test(value)) && (
              <span
                style={{
                  width: size,
                  height: size,
                  border: '1px solid black',
                  borderRadius: '6px',
                  backgroundImage: `${value}`,
                  backgroundColor: `${value}`,
                  backgroundRepeat: `no-repeat`,
                  backgroundSize: 'cover',
                  display: 'inline-block',
                  textShadow: 'white 0px 10px',
                  // backgroundSize: 'cover',
                }}
              ></span>
            )}
            {value}
          </span>
          {alternatives?.length > 0 && (
            <div>
              Alternatives (WIP, can't switch yet):{' '}
              <SelectControl
                onChange={(e) => {
                  const choice = alternatives[e.target.value];
                  console.log(choice);
                }}
                options={alternatives.map((a, i) => ({
                  label: `${a.varName} [element ${a.element} ${a.property}]`,
                  value: i,
                }))}
              />
            </div>
          )}
        </Fragment>
      );
    },

    unset: ({ payload: { scope, name } }) => (
      <Fragment>
        {scope && <pre className="monospace-code">{scope}</pre>}
        <br />
        <b><FormatVariableName {...{name}} /></b> = default
      </Fragment>
    ),

    createAlias: ({ payload: { name, value, generatedName } }) => (
      <span
        draggable
        onDragStart={dragValue(`var(${generatedName})`)}
      >
        Alias
        <br />
        {(COLOR_VALUE_REGEX.test(value) ||
          GRADIENT_REGEX.test(value) ||
          /var\(/.test(value)) && (
          <span
            style={{
              width: size,
              height: size,
              border: '1px solid black',
              borderRadius: '6px',
              backgroundImage: `${value}`,
              backgroundColor: `${value}`,
              backgroundRepeat: `no-repeat`,
              backgroundSize: 'cover',
              display: 'inline-block',
              textShadow: 'white 0px 10px',
            }}
          ></span>
        )}
        <b><FormatVariableName name={generatedName}/> = {value}</b>
      </span>
    ),
  },
};