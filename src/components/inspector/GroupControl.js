import {addHighlight, removeHighlight} from '../../functions/highlight';
import {VariableControl} from './VariableControl';
import {ACTIONS} from '../../hooks/useThemeEditor';
import React, {Fragment, useContext} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import { ElementInlineStyles } from './ElementInlineStyles';
import { ScopeControl } from './ScopeControl';
import { isColorProperty } from './TypedControl';

export const GroupControl = props => {
  const {
    toggleGroup,
    group,
    openGroups,
    index,
  } = props;

  const {
    element,
    label,
    vars,
    scopes,
  } = group;

  const {
    frameRef,
    dispatch,
    propertyFilter,
    propertySearch, setPropertySearch,
    theme,
    defaultValues,
  } = useContext(ThemeEditorContext);

  const groupColors = vars.reduce((colorVars, someVar) => {
    if (isColorProperty(someVar.usages[0].property)) {
      const {name} = someVar;
      const value = theme[name] || defaultValues[name];
      if (value) {
        colorVars.push([someVar, value])
      }
    }
    return colorVars;
  }, []);

  const previewSize = '20px';

  const isOpen = !!openGroups[group.label];

  return <li className={'var-group'} key={label} style={{marginBottom: '12px'}}>
    <div
      onMouseEnter={() => {
        if (element && element.classList) {
          addHighlight(element);
          return;
        }
        if (!frameRef?.current) {
          return;
        }

        frameRef.current.contentWindow.postMessage(
          {
            type: 'highlight-element-start', payload: {index: element}
          },
          window.location.origin,
        );
      }}
      onMouseLeave={() => {
        if (element && element.classList) {
          removeHighlight(element);
          return;
        }
        if (!frameRef?.current) {
          return;
        }

        frameRef.current.contentWindow.postMessage(
          {
            type: 'highlight-element-end', payload: {index: element}
          },
          window.location.origin,
        );
      }}
    >
      <button
        title='Scroll in view'
        className='scroll-in-view'
        style={{
          border: '1px solid gray',
          background: 'white',
          margin: '4px 2px',
          borderRadius: '5px',
          padding: '4px',
          fontSize: '12px',
          float: 'right',
          cursor: 'zoom-in',
        }}
        disabled={frameRef.current && isNaN(element)}
        onClick={() => {
          if (frameRef.current) {
            frameRef.current.contentWindow.postMessage(
              {
                type: 'scroll-in-view', payload: {index: element}
              },
              window.location.href,
            );
            return;
          }
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'end',
          });
        }}
      >👁
      </button>
      <h4
        style={{fontWeight: 400, marginBottom: 0, cursor: 'pointer'}}
        onClick={() => toggleGroup(label, index)}
      >
        {label} ({vars.length})
        {propertyFilter !== 'all' && <span style={{color: 'grey', fontSize: '12px'}}
        >{propertyFilter}</span>}
        { propertySearch !== '' && <span style={{color: 'grey', fontSize: '12px'}}
        >
           - "{propertySearch}"
          <button
            style={{
              fontSize: '7px',
              padding: '3px 3px 1px',
              position: 'relative',
              bottom: '4px',
              borderColor: 'grey'
               }}
            title="Clear search"
            onClick={() => { setPropertySearch('') }}
          >X</button>
           </span>}

        {groupColors.length > 0 && groupColors.map(([{name}, value]) => {
          return <div
              key={name}
              title={`${name}: ${value}`}
              style={{
                display: 'inline-block',
                width: previewSize,
                height: previewSize,
                lineHeight: '1.5',
                border: '1px solid black',
                borderRadius: '6px',
                background: value,
                marginTop: '7px',
                marginLeft: '6px',
                fontSize: '12px',
                textAlign: 'center',
              }}>{/^var\(/.test(value) ? 'v' : <Fragment>&nbsp;</Fragment>}</div>
        })}
      </h4>
    </div>
    {isOpen && <Fragment>
      <ElementInlineStyles {...{group}}/>
      <ScopeControl {...{scopes}}/>
      <ul className={'group-list'}>
        {vars.map(cssVar => {

          return <VariableControl
            {...{
              cssVar,
            }}
            initialOpen={vars.length === 1}
            key={cssVar.name}
            onChange={value => {
              dispatch({ type: ACTIONS.set, payload: { name: cssVar.name, value } });
            }}
            onUnset={() => {
              dispatch({ type: ACTIONS.unset, payload: { name: cssVar.name } });
            }}
          />;
        }
        )}
      </ul></Fragment>}
  </li>;
};
