import React, {useState, useMemo, Fragment, useContext} from 'react';
import {mustBeColor, TypedControl} from './TypedControl';
import { PSEUDO_REGEX, ACTIONS, ROOT_SCOPE} from '../../hooks/useThemeEditor';
import classnames from 'classnames';
import {COLOR_VALUE_REGEX, GRADIENT_REGEX, PREVIEW_SIZE} from '../properties/ColorControl';
import {match} from 'css-mediaquery';
import {isOverridden, VariableScreenSwitcher} from './VariableScreenSwitcher';
import {ThemeEditorContext} from '../ThemeEditor';
import {IdeLink} from './IdeLink';
import { definedValues } from '../../functions/collectRuleVars';
import { VariableReferences } from './VariableReferences';
import { Checkbox } from "../controls/Checkbox";
import { ScrollInViewButton } from './ScrollInViewButton';
import { FilterableVariableList } from '../ui/FilterableVariableList';
import { VariableUsages } from './VariableUsages';
import { useResumableState } from '../../hooks/useResumableReducer';
import { get } from '../../state';
import { MediaQueries } from './MediaQueries';
import { ToggleButton } from '../controls/ToggleButton';

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);
const format = name => {
  if (!/^--/.test(name)) {
    return ['', ''];
  }
  // todo: make this make more sense
  const raw = name
    .replace(/^--/, '')
    .replace(/[-_]/g, ' ');
  const parts =  raw.split('--');

  return [
    parts.slice(0, - 1).join(' — '),
    parts[parts.length - 1].trim().replace(/ /g, '-')
  ];
};
const preventDefault = e=>e.preventDefault();
export const formatTitle = (name, annoyingPrefix, nameReplacements) => {
  const [prefix, prop] = format(name);
  let formattedProp = prop.replaceAll(/-/g, ' ').trim();

  if (annoyingPrefix) {
    formattedProp = formattedProp.replace( new RegExp(`^${annoyingPrefix} `), '').trim();
  }

  formattedProp = !nameReplacements
    ? formattedProp
    : nameReplacements
        .filter((r) => r.active && r.to.length > 0 && r.from.length > 1)
        .reduce(
          (prop, { from, to }) => {
            try {
              return prop.replace(new RegExp(from), to);
            } catch(e) {
              console.log(`Failed replacing ${from} to ${to}`)
              return prop;
            }
          },
          formattedProp
        );

  const annoyingRegex = new RegExp(`^${annoyingPrefix}\\s*\\—\\s*`);
  const cleanedPrefix = prefix.trim().replace(annoyingRegex, '');

  return <Fragment>
    <span
      style={{
        fontSize: '13px',
        fontStyle: 'italic',
        color: 'black',
        display: 'block',
      }}
    >{capitalize(annoyingPrefix ? cleanedPrefix : prefix)}</span>
    <span style={{fontWeight: 'bold'}} className={'var-control-property'}>{formattedProp}</span>
  </Fragment>;
};

const previewValue = (value, cssVar, onClick, isDefault, referencedVariable, isOpen) => {
  const size = PREVIEW_SIZE;
  const title = `${value}${!isDefault ? '' : ' (default)'}`;
  const isUrl = /url\(/.test(value);
  const isColor =
    mustBeColor(cssVar) ||
    COLOR_VALUE_REGEX.test(value) ||
    GRADIENT_REGEX.test(value);
  const presentable = isColor || isUrl;

  if (value && presentable && !/currentcolor/i.test(value)) {
    if (referencedVariable && isOpen) {
      // Both value and preview are shown on the referenced variable when open.
      return null;
    }
    return (
      <Fragment>
        <span
          draggable
          onDragStart={e=>e.dataTransfer.setData('value', value)}
          key={1}
          onClick={onClick}
          title={title}
          style={{
            width: size,
            height: size,
            border: '1px solid black',
            borderRadius: '6px',
            backgroundImage: `${value}`,
            backgroundColor: cssVar.cssFunc ? `${cssVar.cssFunc}(${value})` : value,
            backgroundRepeat: `no-repeat`,
            backgroundSize: 'cover',
            // background:,
            float: 'right',
            textShadow: 'white 0px 10px',
            // backgroundSize: 'cover',
          }}
        >
          {/var\(/.test(value) && 'var'}
          {value === 'transparent' && '👻'}
        </span>
        <span style={{ float: 'right', marginRight: '4px' }}>
          {(referencedVariable?.name || '').replaceAll(/-+/g, ' ').trim() ||
            (isUrl ? null : value)}
        </span>
      </Fragment>
    );
  }

  return <span
    key={ 1 }
    onClick={ onClick }
    title={ title }
    style={ {
      // width: size,
      fontSize: '14px',
      float: 'right',
    } }
  >
    { value }
  </span>;
};

// Get values from specificity ordered scopes.
export function getValueFromDefaultScopes(scopes, cssVar) {
  if (!scopes) {
    return null;
  }
  for (const {selector} of scopes) {
    if (definedValues[selector]?.hasOwnProperty(cssVar.name)) {
      return definedValues[selector][cssVar.name];
    }
  }
  return null;
}

function referenceChainKey(references, cssVar) {
  return [...references, cssVar].map(v=>v.name).join();
}

export const VariableControl = (props) => {
  const {
    cssVar,
    onChange,
    onUnset,
    initialOpen = false,
    referenceChain = [],
    scopes: elementScopes,
    parentVar,
    element,
    currentScope = ROOT_SCOPE,
  } = props;

  const { width, annoyingPrefix, nameReplacements, showCssProperties, linkCssProperties } = get;

  const {
    scopes,
    dispatch,
    defaultValues,
    allVars,
  } = useContext(ThemeEditorContext);

  const theme = scopes[ROOT_SCOPE] || {};

  const {
    name,
    usages,
    maxSpecific,
    positions,
    properties,
  } = cssVar;

  const uniqueSelectors = new Set(usages.map(u=>u.selector)).size;

  const defaultValue =
    getValueFromDefaultScopes(elementScopes, cssVar) ||
    defaultValues[name] ||
    cssVar.maxSpecific?.defaultValue || cssVar.usages[0].defaultValue;

  const [overwriteVariable, setOverwriteVariable] = useState(false);

  const valueFromScope = !scopes || !scopes[currentScope] ? null : scopes[currentScope][name];

  const value = valueFromScope || defaultValue;
  const isDefault = value === defaultValue;
  const {media} = maxSpecific || {};

  // Resolve variables inside the value.
  // WIP: doesn't do all substitutions yet, but simple work.
  let resolvedValue = value;
  while (resolvedValue?.includes('var(--')) {
    const name = '--' + resolvedValue.split('var(--')[1].replace(/[\s\),].*/, '')
    let replacingValue
    for (const {selector} of elementScopes) {
      if (name in (scopes[selector] || {})) {
        replacingValue = scopes[selector][name]
        break;
      }
      if (name in (definedValues[selector] || {})) {
        replacingValue = definedValues[selector][name]
        break;
      }
    }
    if (!replacingValue) {
      break;
    }
    const regex = new RegExp(`var\\(\\s*${name.replaceAll(/-/g, "\\-")}[\\s\\,\\)]`);
    if (regex.test(replacingValue)) {
      resolvedValue = '<<invalid: self-reference>>';
      break;
    }
    resolvedValue = resolvedValue.replace(/var\(.*\)/, replacingValue)
  }

  const varMatches = value && value.match(/^var\(\s*(\-\-[\w-]+)\s*[\,\)]/);
  const [referencedVariable, usedScope] = useMemo(() => {
    const referredVar = !varMatches || varMatches.length === 0
      ? null
      : allVars.find((cssVar) => cssVar.name === varMatches[1]) || {
          name: varMatches[1],
          usages: [
            {
              property: cssVar.maxSpecific?.defaultValue || cssVar.usages[0].property,
              isFake: true,
            },
          ],
          properties: {},
          positions: [],
        };
    if (!referredVar) {
      return [];
    }
    const usedScope = elementScopes?.find((scope) =>
      scope.scopeVars.some((v) => v.name === varMatches[1])
    )?.selector;
    return [referredVar, usedScope];
  }, [value]);
  const {overridingMedia} = cssVar.allVar || cssVar;
  const matchesQuery =
    !media ||
    match(media, {
      type: 'screen',
      width,
      // Below are some values which can later be pulled from settings.
      // This way the `match` dependency can properly resolve all media rules.
      // Hence this list will contain some obscure entries that will likely never be used.
      // Entries for which no clear value can be determined are not included for now.
      'any-hover': 'hover',
      'any-pointer': 'fine',
      // 'aspect-ratio': '',
      // 'color': '',
      // 'color-gamut': '',
      // 'color-index': '',
      // The following 3 are deprecated, but perhaps still common enough?
      // 'device-aspect-ratio': '',
      // 'device-height': '',
      // 'device-width': '',
      // 'display-mode': '',
      // 'dynamic-range': 'standard',
      'forced-colors': 'none',
      // grid: '',
      hover: 'hover',
      'inverted-colors': 'none',
      // monochrome: '',
      // orientation: width > height ? 'landscape' : 'portrait',
      // 'overflow-block': '',
      // 'overflow-inline': '',
      pointer: 'fine',
      'prefers-color-scheme': get.prefersColorScheme,
      'prefers-contrast': 'no-preference',
      'prefers-reduced-motion': 'no-preference',
      'prefers-reduced-transparency': 'no-preference',
      // resolution: '',
      scripting: 'enabled',
      update: 'fast',
      // 'video-dynamic-range': 'standard',
    });
  const matchesScreen = matchesQuery && (!overridingMedia || !isOverridden({media, cssVar, width}));

  let currentLevel = referenceChain.length;
  const key = referenceChainKey(referenceChain, cssVar);

  const [
    isOpen, setIsOpen
    // Open all variables that refer to variables immediately.
  ] = useResumableState(`open_${key}`, initialOpen || (currentLevel > 0 && !!referencedVariable));

  const toggleOpen = () => setIsOpen(!isOpen );

  const [
    showSelectors, setShowSelectors
  ] = useResumableState(`showSelectors_${key}`, false);

  const excludedVarName = parentVar?.name;

  const references = useMemo(() => {
    // Prevent much unneeded work on large lists.
    if (!isOpen) {
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
      if (name === excludedVarName) {
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
  }, [scopes, excludedVarName, isOpen]);

  const [showReferences, setShowReferences] = useState(false);
  const [openVariablePicker, setOpenVariablePicker] = useState(false);

  const cssFunc = cssVar.cssFunc;

  if (currentLevel > 20) {
    // Very long dependency chain, probably cyclic, let's break it here.
    // I'll prevent setting cyclic references in the first place.
    // Though this could also be an error in the source CSS.
    return null;
  }

  const isInTheme = name in theme || name in (scopes[currentScope] || {});

  return (
    <li
      onDragEnter={cssVar.isRawValue ? null : preventDefault}
      onDragOver={cssVar.isRawValue ? null : preventDefault}
      onDrop={e=> {
        if (cssVar.isRawValue) {
          return;
        }
        const value = e.dataTransfer.getData('value');
        const regex = new RegExp(`var\\(\\s*${cssVar.name.replaceAll(/-/g, "\\-")}[\\s\\,\\)]`);
        // Prevent dropping any direct references to itself.
        if (regex.test(value)) {
          return;
        }
        if (value) {
          onChange(value)
        }
        // e.preventDefault();
        e.stopPropagation();
        // e.stopImmediatePropagation();
      }}
      data-nesting-level={currentLevel}
      key={name}
      className={classnames('var-control', {
        'var-control-in-theme': isInTheme,
        'var-control-no-match-screen': !matchesScreen,
      })}
      onClick={() => !isOpen && toggleOpen()}
      style={{
        // userSelect: 'none',
        position: 'relative',
        listStyleType: 'none',
        fontSize: '15px',
        clear: 'both',
        cursor: isOpen ? 'auto' : 'pointer',
        paddingTop: 0,
      }}
    >
      {!matchesScreen && <VariableScreenSwitcher {...{ cssVar, media }} />}
      <div style={{ paddingTop: '6px' }} onClick={() => isOpen && toggleOpen()}>
        <h5
          draggable
          onDragStart={e=>e.dataTransfer.setData('value', `var(${name})`)}
          style={{
            display: 'inline-block',
            fontSize: '16px',
            padding: '0 4px 0',
            fontWeight: '400',
            userSelect: 'none',
            cursor: 'pointer',
            clear: 'left',
          }}
        >
          {formatTitle(name, annoyingPrefix, nameReplacements)}
        </h5>
        {previewValue(value, cssVar, toggleOpen, isDefault, referencedVariable, isOpen)}
        <div>
          {media && <MediaQueries {...{media}} />}
          {!!showCssProperties && <Fragment>
            {!!cssFunc && <span style={{color: 'darkcyan'}}>{cssFunc}</span>}
            {Object.entries(properties).map(([property, {isFullProperty, fullValue, isImportant}]) => {
              const comp = (
                <span
                  key={property}
                  className="monospace-code"
                  style={{
                    fontSize: '14px',
                    ...(property !== maxSpecific?.property ? { background: 'grey' } : {})
                  }}
                  title={isFullProperty ? '' : fullValue} 
                >
                  {property}
                  {!isFullProperty && <b style={{ color: 'red' }}>*</b>}
                  {!!isImportant && <b style={{ fontWeight: 'bold', color: 'darkorange' }}>!important</b>}
                </span>
              );
              if (!linkCssProperties) {
                return comp;
              }
              return (
                <a
                  key={property}
                  target={'_blank'}
                  href={`https://developer.mozilla.org/en-US/docs/Web/CSS/${property}`}
                  style={{ cursor: 'help' }}
                >
                  {comp}
                </a>
              );
            })}
          </Fragment>}
        </div>
      </div>
      {!!positions[0] && <IdeLink {...(positions[0] || {})} />}
      {isOpen && (
        <Fragment>
          {references.length > 0 && (
            <div>
              <ToggleButton
                title={references.map((r) => r.name).join('\n')}
                style={{ fontSize: '14px' }}
                controls={[showReferences, setShowReferences]}
              >
                Used by {references.length} other
              </ToggleButton>
              {showReferences && <VariableReferences {...{ references }} />}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              clear: 'both',
              justifyContent: 'flex-end',
            }}
          >
            {isDefault && !cssVar.isRawValue && (
              <span
                style={{
                  margin: '6px 6px 0',
                  color: 'grey',
                }}
              >
                default{' '}
              </span>
            )}
            {isInTheme && defaultValue !== null && (
              <button
               title={`Remove from current theme? The value from the default theme will be used, which is currently: "${defaultValue}"`}
                onClick={() => {
                  onUnset();
                }}
              >
                Revert
              </button>
            )}

            {referencedVariable && (
              <button
                style={{borderWidth: overwriteVariable ? '4px' : '1px'}}
                onClick={() => {
                  setOverwriteVariable(!overwriteVariable);
                }}
              >
                Raw
              </button>
            )}

            {/^--/.test(cssVar.name) && <button
              style={{borderWidth: openVariablePicker ? '4px' : '1px'}}
              onClick={(event) => {
              setOpenVariablePicker(!openVariablePicker);
              event.stopPropagation();
            }}>
              Link
            </button>}

            {!usages[0].isFake && (
              <ToggleButton controls={[showSelectors, setShowSelectors]}>
                Selectors ({uniqueSelectors})
              </ToggleButton>
            )}

            {typeof element !== 'undefined' && (
              <span key="foobar">
                <ScrollInViewButton {...{ element }} />
              </span>
            )}
          </div>
          {openVariablePicker && (
            <FilterableVariableList
              {...{value, elementScopes}}
              onChange={(value) => {
                // setOpenVariablePicker(false);
                onChange(value);
              }}
            />
          )}
          {showSelectors && !usages[0].isFake && (
            <Fragment>
              <div>{name}</div>
              <VariableUsages
                {...{
                  usages,
                  maxSpecificSelector: maxSpecific?.selector,
                  winningSelector: maxSpecific?.winningSelector,
                  scope: currentScope,
                }}
              />
            </Fragment>
          )}
          {(!referencedVariable || overwriteVariable) && !openVariablePicker && (
            <div
              // onMouseEnter={() => {
              //   PSEUDO_REGEX.test(name) &&
              //     dispatch({
              //       type: ACTIONS.startPreviewPseudoState,
              //       payload: { name },
              //     });
              // }}
              // onMouseLeave={() => {
              //   PSEUDO_REGEX.test(name) &&
              //     dispatch({
              //       type: ACTIONS.endPreviewPseudoState,
              //       payload: { name },
              //     });
              // }}
            >
              <br />
              <TypedControl {...{ cssVar, value, resolvedValue, onChange, cssFunc }} />
            </div>
          )}
          {!!referencedVariable && !overwriteVariable && (
            <ul style={{ margin: 0 }}>
              <span className='monospace-code'>{usedScope}</span>
              <VariableControl
                {...{ scopes: elementScopes, currentScope: usedScope }}
                cssVar={referencedVariable}
                onChange={(value) => {
                  dispatch({
                    type: ACTIONS.set,
                    payload: { name: referencedVariable.name, value, scope: usedScope },
                  });
                }}
                onUnset={() => {
                  dispatch({
                    type: ACTIONS.unset,
                    payload: { name: referencedVariable.name, scope: usedScope },
                  });
                }}
                key={referencedVariable.name}
                referenceChain={[...referenceChain, cssVar]}
                parentVar={cssVar}
              />
            </ul>
          )}
        </Fragment>
      )}
    </li>
  );
};
