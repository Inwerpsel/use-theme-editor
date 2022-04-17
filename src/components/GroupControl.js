import {addHighlight, removeHighlight} from '../functions/highlight';
import {VariableControl} from './VariableControl';
import {THEME_ACTIONS} from '../hooks/useThemeEditor';
import React, {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';

export const GroupControl = props => {
  const {
    toggleGroup,
    group,
    openGroups,
  } = props;

  const {
    element,
    label,
    vars,
  } = group;

  const {
    frameRef,
    defaultValues,
    dispatch,
    propertyFilter,
  } = useContext(ThemeEditorContext);

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
        onClick={() => toggleGroup(label)}
      >
        {label} ({vars.length})
        {propertyFilter !== 'all' && <span style={{color: 'grey', fontSize: '12px'}}
        >{propertyFilter}</span>}
      </h4>
    </div>
    {isOpen && <ul>
      {vars.map(cssVar => {
        const defaultValue = defaultValues[cssVar.name];

        return <VariableControl
          {...{
            cssVar,
            defaultValue,
          }}
          initialOpen={vars.length === 1}
          key={cssVar.name}
          onChange={value => {
            dispatch({type: THEME_ACTIONS.SET, payload: {name: cssVar.name, value}});
          }}
          onUnset={() => {
            dispatch({type: THEME_ACTIONS.UNSET, payload: {name: cssVar.name}});
          }}
        />;
      }
      )}
    </ul>}
  </li>;
};
