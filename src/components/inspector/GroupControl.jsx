import {getValueFromDefaultScopes, resolveVariables, VariableControl} from './VariableControl';
import {ACTIONS} from '../../hooks/useThemeEditor';
import React, {Fragment, useContext, useMemo} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import { ElementInlineStyles } from './ElementInlineStyles';
import { ScopeControl } from './ScopeControl';
import { mustBeColor } from './TypedControl';
import { definedValues, scopesByProperty } from '../../functions/collectRuleVars';
import { ScrollInViewButton } from './ScrollInViewButton';
import { get, use } from '../../state';
import { dragValue } from '../../functions/dragValue';

const previewSize = '28px';

export const GroupControl = props => {
  const {
    group,
  } = props;

  const { propertyFilter } = get;
  const [{scopes}, dispatch] = use.themeEditor();

  const [search, setSearch] = use.search();
  const [darkSvg, setDarkSvg] = use.svgDarkBg();

  const {
    element,
    elementInfo: {
      src,
      srcset,
      alt,
      title,
      html,
      width,
    },
    textContent,
    label,
    vars,
    scopes: elementScopes,
    isRootElement,
    isDeepest,
    inlineStyles,
  } = group;

  const {
    frameRef,
    defaultValues,
    openGroups,
    setOpenGroups,
  } = useContext(ThemeEditorContext);

  const toggleGroup = id => {
    // Todo: further reduce stored size, perhaps use different key.
    const {[id]: wasOpen, ...other} = openGroups;
    const newGroups = wasOpen ? other : {...other, [id]: true};
    setOpenGroups(newGroups);
  };

  const groupColors = useMemo(() => {
    return vars.reduce((colorVars, someVar) => {
      if (mustBeColor(someVar)) {
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
            if (currentScope) {
              // Scopes should be sorted by specificity, and maybe also take body and html into account.
              break;
            }
          }
        }
        const valueFromScope =
          !scopes || !currentScope || !scopes[currentScope.selector]
            ? null
            : scopes[currentScope.selector][name];

        const rawValue =
          valueFromScope  ||
          defaultValues[name] ||
          getValueFromDefaultScopes(elementScopes, someVar) ||
          definedValues[':root'][name];

        const [value] = resolveVariables(rawValue, elementScopes, scopes);

        if (value && value!== 'inherit' && value.toLowerCase() !== 'currentcolor') {
          colorVars.push([someVar, someVar.cssFunc ? `${someVar.cssFunc}(${value})` : value, rawValue]);
        }
      }
      return colorVars;
    }, []);
  }, [vars, elementScopes, scopes]);

  const isEmpty = vars.length === 0;
  const hasContent = !isEmpty || inlineStyles;

  if (!hasContent && !isDeepest && !src && !html) { 
    return null;
  }

  const isOpen = !!openGroups[label];

  return (
    <li className={'var-group'} key={label} style={{marginBottom: '12px'}}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 12,
          overflow: isOpen ? 'hidden' : 'auto',
        }}
        onMouseEnter={() => {
          frameRef.current?.contentWindow.postMessage(
            {
              type: 'highlight-element-start', payload: {index: element}
            },
            window.location.origin,
          );
        }}
        onMouseLeave={() => {
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
          style={{
            fontWeight: 400,
            marginBottom: 0,
            paddingRight: '4px',
            cursor: !hasContent ? 'initial' : 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            maxHeight: isOpen ? '128px' : '300px',
            overflowY: 'auto',
          }}
          onClick={!hasContent ? null : () => toggleGroup(label)}
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
                  padding: '3px 3px 1px',
                  position: 'relative',
                  bottom: '4px',
                  borderColor: 'grey'
                  }}
                title="Clear search"
                onClick={() => { setSearch('') }}
              >X</button>
              </span>}
            {groupColors.length > 0 && <div>
              {groupColors.map(([{name}, value, rawValue]) => {
                const isVar = name.startsWith('--');
                return (
                  <div
                    onDragOver={event=>event.preventDefault()}
                    onDrop={event=> {
                      let value = event.dataTransfer.getData('value');
                      if (value === '') {
                        value = event.dataTransfer.getData('text/plain').trim();
                      }
                      if (value === '') {
                        return;
                      }
                      dispatch({type: ACTIONS.set, payload: {name, value}})
                    }}
                    draggable
                    onDragStart={dragValue(rawValue)}
                    key={name}
                    title={name === value ? name : `${name}: ${rawValue}`}
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
                      marginTop: '3px',
                      marginLeft: '6px',
                      paddingTop: '3.5px',
                      fontSize: '14px',
                      textAlign: 'center',
                      textShadow: isVar ? 'white 0px 3px' : 'white 2px 2px'
                    }}>{/^var\(/.test(rawValue) ? 'v' : value === 'transparent' ? '👻' : ! isVar ? 'r': <Fragment>&nbsp;</Fragment>}</div>
                );
                })}
            </div>}
          </div>

          {src && <img src={src} srcSet={srcset} alt={alt} title={title || alt} style={{height: '52px', float: 'right', backgroundColor: 'grey'}}/>}
          {html?.length > 0 && <div
            className='svg-inspect-wrapper'
            style={{display: 'inline', position: 'relative', minWidth: `${width}px`, maxWidth: '50%', maxHeight: '160px', outline: '1px solid grey', padding: '2px', background: darkSvg ? 'black' : 'transparent'}}
            onClick={(e) => {setDarkSvg(!darkSvg); e.stopPropagation()}}
            dangerouslySetInnerHTML={{__html: html}}
          ></div>}
          {textContent && <div style={{fontSize: '12px', border: '1p solid grey',background:'lightgrey',maxWidth: '45%', margin: '4px', padding: '4px', float: 'right', maxHeight: '62px', overflow: 'auto'}}>{textContent}</div>}
          {inlineStyles && <span style={{...{border: '1px solid black'}, ...inlineStyles, ...{maxHeight: previewSize, width: 'auto'}}}>Inline</span>}
          
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
              }}
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
    </li>
  );
};
