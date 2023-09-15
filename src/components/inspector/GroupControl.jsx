import {addHighlight, removeHighlight} from '../../functions/highlight';
import {getValueFromDefaultScopes, VariableControl} from './VariableControl';
import {ACTIONS} from '../../hooks/useThemeEditor';
import React, {Fragment, useContext, useMemo} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import { ElementInlineStyles } from './ElementInlineStyles';
import { ScopeControl } from './ScopeControl';
import { isColorProperty } from './TypedControl';
import { definedValues, scopesByProperty } from '../../functions/collectRuleVars';
import { ScrollInViewButton } from './ScrollInViewButton';
import { get, use } from '../../state';

export const GroupControl = props => {
  const {
    group,
  } = props;

  const { propertyFilter } = get;

  const [search, setSearch] = use.search();

  const {
    element,
    elSrc,
    elSrcset,
    elAlt,
    elTitle,
    label,
    vars,
    scopes: elementScopes,
    isRootElement,
  } = group;

  const {
    frameRef,
    dispatch,
    defaultValues,
    scopes,
    openGroups,
    setOpenGroups,
  } = useContext(ThemeEditorContext);

  const toggleGroup = id => setOpenGroups({...openGroups, [id]: !openGroups[id]});

  const groupColors = useMemo(() => {
    return vars.reduce((colorVars, someVar) => {
      if (isColorProperty(someVar.maxSpecific?.property || someVar.usages[0].property)) {
        const { name } = someVar;
        if (!name.startsWith('--')) {
          // Quick fix to prevent currently non-presentable value.
          if (name.toLowerCase() !== 'currentcolor') {
          // Quick fix to make it work with raw values.
            colorVars.push([someVar, name]);
          }
          return colorVars;
        }

        const propertyScopes = scopesByProperty[name];
        let currentScope = null;
        if (elementScopes.length > 0) {
          for (const key in propertyScopes || {}) {
            currentScope =
              elementScopes.find((s) => s.selector === key) || currentScope;
          }
        }
        const valueFromScope =
          !scopes || !currentScope || !scopes[currentScope.selector]
            ? null
            : scopes[currentScope.selector][name];

        const value =
          valueFromScope ||
          definedValues[':root'][name] ||
          defaultValues[name] ||
          getValueFromDefaultScopes(elementScopes, someVar)

        if (value && value.toLowerCase() !== 'currentcolor') {
          colorVars.push([someVar, someVar.cssFunc ? `${someVar.cssFunc}(${value})` : value]);
        }
      }
      return colorVars;
    }, []);
  }, [vars, elementScopes, scopes]);

  if (vars.length === 0 && !group.inlineStyles) { 
    return null;
  }

  const previewSize = '20px';

  const isOpen = !!openGroups[group.label];

  return <li className={'var-group'} key={label} style={{marginBottom: '12px'}}>
    <div
      onMouseEnter={() => {
        if (element && element.classList) {
          addHighlight(element);
          return;
        }

        frameRef.current?.contentWindow.postMessage(
          {
            type: 'highlight-element-start', payload: {index: element}
          },
          window.location.origin,
        );
      }}
      onMouseLeave={() => {
        if (element?.classList) {
          removeHighlight(element);
          return;
        }

        frameRef.current?.contentWindow.postMessage(
          {
            type: 'highlight-element-end', payload: {index: element}
          },
          window.location.origin,
        );
      }}
    >
      {isRootElement ? <span style={{float: 'right'}}>global</span> : <ScrollInViewButton {...{element}}/>}
      
      <h4
        style={{fontWeight: 400, marginBottom: 0, paddingRight: '4px',cursor: 'pointer', display: 'flex', justifyContent: 'space-between'}}
        onClick={() => toggleGroup(label)}
      >
        <div>
          {label} ({vars.length})
          {propertyFilter !== 'all' && <span style={{color: 'grey', fontSize: '12px'}}
          >{propertyFilter}</span>}
          { search !== '' && <span style={{color: 'grey', fontSize: '12px'}}
          >
            - "{search}"
            <button
              style={{
                fontSize: '7px',
                padding: '3px 3px 1px',
                position: 'relative',
                bottom: '4px',
                borderColor: 'grey'
                }}
              title="Clear search"
              onClick={() => { setSearch('') }}
            >X</button>
            </span>}
          {groupColors.length > 0 && <ul style={{listStyleType: 'none', display: 'inline-flex', margin: 0}}>
            {groupColors.map(([{name}, value]) => {
              return <div
                draggable
                onDragStart={e=>e.dataTransfer.setData('value', value)}
                key={name}
                title={`${name}: ${value}`}
                style={{
                  display: 'inline-block',
                  width: previewSize,
                  height: previewSize,
                  lineHeight: '1.5',
                  border: '1px solid black',
                  borderRadius: '6px',
                  backgroundImage: `${value}`,
                  backgroundColor: `${value}`,
                  backgroundRepeat: `no-repeat`,
                  backgroundSize: 'cover',
                  marginTop: '7px',
                  marginLeft: '6px',
                  fontSize: '12px',
                  textAlign: 'center',
                  textShadow: 'white 0px 3px'
                }}>{/^var\(/.test(value) ? 'v' : value === 'transparent' ? '👻' : <Fragment>&nbsp;</Fragment>}</div>
              })}
          </ul>}
        </div>

        {elSrc && <img src={elSrc} srcSet={elSrcset} alt={elAlt} title={elTitle || elAlt} style={{height: '52px', float: 'right', backgroundColor: 'grey'}}/>}
        {group.inlineStyles && <span style={{...{border: '1px solid black'}, ...group.inlineStyles, ...{maxHeight: previewSize, width: 'auto'}}}>Inline</span>}
        
      </h4>
    </div>
    {isOpen && <Fragment>
      <ElementInlineStyles {...{group, elementScopes}}/>
      <ScopeControl {...{scopes: elementScopes, vars, element}}/>
      <ul className={'group-list'}>
        {vars.filter(v=>!v.currentScope).map(cssVar => {
          return <VariableControl
            {...{
              cssVar,
              scopes: elementScopes,
              element,
            }}
            initialOpen={vars.length === 1}
            key={cssVar.name}
            onChange={value => {
              dispatch({
                type: ACTIONS.set,
                payload: {
                  name: cssVar.name, 
                  value,
                }
              });
            }}
            onUnset={() => {
              dispatch({ type: ACTIONS.unset, payload: { name: cssVar.name } });
            }}
          />;
        }
        )}
      </ul>
    </Fragment>}
  </li>;
};
