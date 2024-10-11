import {getValueFromDefaultScopes, resolveVariables, VariableControl} from './VariableControl';
import {ACTIONS, editTheme} from '../../hooks/useThemeEditor';
import React, {Fragment, useContext, useEffect, useMemo} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import { ElementInlineStyles } from './ElementInlineStyles';
import { ScopeControl } from './ScopeControl';
import { mustBeColor } from './TypedControl';
import { definedValues, scopesByProperty } from '../../functions/collectRuleVars';
import { ScrollInViewButton } from './ScrollInViewButton';
import { get, use } from '../../state';
import { dragValue } from '../../functions/dragValue';
import { oklch, toOk } from '../properties/OklchColorControl';
import { clampChroma } from 'culori';
import { evaluateCalc } from '../properties/CalcSizeControl';
import { findClosingBracket } from '../../functions/compare';
import { ImageColors } from './ImageColors';
import { Checkbox } from '../controls/Checkbox';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { readSync } from '../../hooks/useGlobalState';
import { useDispatcher } from '../../hooks/useResumableReducer';
import { onLongPress } from '../../functions/onLongPress';
import { addHighlight, removeHighlight } from '../../functions/highlight';

const previewSize = '28px';

function applyHueFromDropped(data, event) {
  event.preventDefault();
  event.stopPropagation();
  const color = event.dataTransfer.getData('value');
  if (!color) return;
  applyHueToAllColors(color, data)
}

export function applyHueToAllColors(rawColor, {groupColors, maximizeChroma}) {
  const color = toOk(rawColor);
  if (!color) return;

  const refs = groupColors.filter(([v])=>!v.isRawValue).map(([{name}]) => `var(${name})`);
  let changed = false;

  const dispatch = editTheme();

  groupColors.forEach(([{name, isRawValue}, value, unparsed, scope = ':root']) => {
    if (isRawValue) return;

    if (refs.includes(unparsed)) {
      return;
    }

    const parsed = toOk(value);
    if (!parsed) return;

    const blackOrWhite = parsed.l < 0.001 || parsed.l > 0.999;
    
    // Skip grayscale values as they wouldn't really change.
    if (blackOrWhite || (!maximizeChroma && parsed.c === 0)) return;
    const {
      l,
      c,
      h,
      alpha = 1,
    } = clampChroma(
      { ...parsed, c: maximizeChroma ? 0.4 : parsed.c, h: color.h },
      'oklch',
      'p3'
    );
    const newValue = oklch(l * 100, c, h, alpha);
    if (newValue === value) {
      return;
    }
    changed = true;
    dispatch(
      {
        type: ACTIONS.set,
        payload: {
          name,
          scope,
          value: newValue,
        },
      },
      { debounceTime: 0 }
    );
  });

  return changed;
}

export const GroupControl = props => {
  const {
    group,
  } = props;

  const { propertyFilter, maximizeChroma  } = get;
  const [{scopes}, dispatch] = use.themeEditor();

  const [search, setSearch] = use.search();
  const [darkSvg, setDarkSvg] = use.svgDarkBg();
  const setPicked = useDispatcher('pickedValue');
  const [showImageColors, setShowImageColors] = useLocalStorage('image color show', false);

  const {
    element,
    path,
    elementInfo: {
      src,
      srcset,
      imgWidth,
      imgHeight,
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

  useEffect(() => {
    // Freeze display rules during inspection by adding as inline styles.
    // Kinda shaky but almost anything is better than not seeing inspected element.

    // When the data is in a better shape, correcting the display should be easy.

    const d = getComputedStyle(element).display;
    if (d === 'none') {
      // Element started hidden (restored history), not attempt to figure out right display for now.
      element.style.display = 'block';
    } else {
      // The element was clicked, in order to be sure to capture anything that could be overridden with none,
      // we have to set the display of all elements as an inline style.
      element.style.display = d;
    }
    element.style.opacity = 1;
    element.style.visibility = 'visible';
    return () => {
    element.style.display = null;
    element.style.visibility = null;
    element.style.opacity = null;
    };
  }, []);

  const {
    frameRef,
    defaultValues,
  } = useContext(ThemeEditorContext);
  const [openGroups, setOpenGroups] = use.openGroups();

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
        let currentScope = someVar.currentScope;
        if (!currentScope && (elementScopes.length > 0)) {
          for (const key in propertyScopes || {}) {
            currentScope =
              elementScopes.find((s) => s.selector === key)?.selector || currentScope;
            if (currentScope) {
              // Scopes should be sorted by specificity, and maybe also take body and html into account.
              break;
            }
          }
        }
        const defaultValue =
          definedValues[currentScope || ':root'][name] ||
          getValueFromDefaultScopes(elementScopes, someVar) ||
          defaultValues[name] ||
          someVar.maxSpecific?.defaultValue || someVar.usages[0].defaultValue;
        const valueFromScope = !scopes || !scopes[currentScope] ? null : scopes[currentScope][name];
        const rawValue = valueFromScope || defaultValue;

        let [value] = resolveVariables(rawValue, elementScopes, scopes);

        if (value.includes('calc(')) {
          const scenario = {steps: []};
          let tmp = value;
          while (tmp.includes('calc(')) {
            const start = tmp.indexOf('calc(');
            const end = findClosingBracket(tmp, start + 5);
            try {
              const [result] = evaluateCalc(tmp.slice(start + 5, end - 1), scenario);
              tmp = tmp.slice(0, start) + result + tmp.slice(end + 1);
            } catch(e) {
              break;
            }
          }
          value = tmp;
        }

        if (value && value!== 'inherit' && value.toLowerCase() !== 'currentcolor') {
          colorVars.push([someVar, someVar.cssFunc ? `${someVar.cssFunc}(${value})` : value, rawValue, currentScope]);
        }
      }
      return colorVars;
    }, []);
  }, [vars, elementScopes, scopes]);

  const isEmpty = vars.length === 0;
  const hasContent = !isEmpty || inlineStyles || src;

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
          addHighlight(element)
        }}
        onMouseLeave={() => {
          removeHighlight(element);
        }}
      >
        {isRootElement ? <span style={{float: 'right'}}>global</span> : <ScrollInViewButton {...{path}}/>}
        
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
            overflowX: 'hidden',
            overflowY: 'auto',
          }}
          onClick={!hasContent ? null : (event) => {
            const picked = readSync('pickedValue');
            if (picked) {
              const changed = applyHueToAllColors(picked, {groupColors, maximizeChroma});
              // Allow still opening an element if no change was made.
              if (changed) return;
            }
            toggleGroup(label);
          }}
          onDrop={(event) => applyHueFromDropped({groupColors, maximizeChroma}, event)}
          onDragOver={(e) => {e.preventDefault()}}
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
            {groupColors.length > 0 && <div style={{overflowX: 'hidden'}}>
              {groupColors.map(([{name}, value, rawValue, scope]) => {
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
                      dispatch({type: ACTIONS.set, payload: {name, value, scope}})
                      event.stopPropagation();
                    }}
                    draggable
                    {...onLongPress(() => setPicked(value))}
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
        {src &&<Checkbox controls={[showImageColors, setShowImageColors]}>Extract colors</Checkbox>}
        {src && <code style={{float: 'right'}}>{imgWidth} x {imgHeight}</code>}
        {src && showImageColors && <ImageColors path={src} />}
        <ElementInlineStyles {...{group, elementScopes}}/>
        <ScopeControl {...{scopes: elementScopes, vars}}/>
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
