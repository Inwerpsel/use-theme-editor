import React, {useState, useMemo, Fragment, useContext} from 'react';
import {isColorProperty, TypedControl} from './TypedControl';
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
import { rootScopes } from '../../functions/extractPageVariables';
import { useResumableState } from '../../hooks/useResumableReducer';
import { useWidth } from '../../state';

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);
const format = name => {
  // todo: make this make more sense
  const raw = name.replace(/^--/, '').replace(/--/g, ': ').replace(/[-_]/g, ' ');
  const parts = raw.split(':');

  return [
    parts.slice(0, - 1).join(' — '),
    parts[parts.length - 1].trim().replace(/ /g, '-')
  ];
};
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
          (prop, { from, to }) => prop.replace(new RegExp(from), to),
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
  const property = cssVar.usages && cssVar.usages[0]?.property;
  const isColor =
    isColorProperty(property) ||
    COLOR_VALUE_REGEX.test(value) ||
    GRADIENT_REGEX.test(value);
  const presentable = isColor || isUrl;

  if (value && presentable) {
    if (!!referencedVariable && isOpen) {
      // Both value and preview are shown on the referenced variable when open.
      return null;
    }
    return (
      <Fragment>
        <span
          key={1}
          onClick={onClick}
          title={title}
          style={{
            width: size,
            height: size,
            border: '1px solid black',
            borderRadius: '6px',
            backgroundImage:  `${value}`,
            backgroundColor:  `${value}`,
            backgroundRepeat:  `no-repeat`,
            backgroundSize: 'cover',
            // background:,
            float: 'right',
            textShadow: 'white 0px 10px',
            // backgroundSize: 'cover',
          }}
        >
          {/var\(/.test(value) && 'var'}
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
  for (const {selector, scopeVars} of scopes) {

    if (!scopeVars) {
      console.log('A scope with no vars?!', selector, cssVar)
    }
    if (scopeVars && scopeVars.some(v=>v.name === cssVar.name)) {
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
    nestingLevel,
    referenceChain = [],
    scopes: elementScopes,
    parentVar,
    element,
    currentScope = ROOT_SCOPE,
  } = props;

  const {
    scopes,
    dispatch,
    defaultValues,
    allVars,
    annoyingPrefix,
    showCssProperties,
    nameReplacements,
  } = useContext(ThemeEditorContext);
  const [width] = useWidth();
  const theme = scopes[ROOT_SCOPE] || {};

  const {
    name,
    usages,
    maxSpecific,
    positions,
    properties,
  } = cssVar;

  const defaultValue =
    definedValues[':root'][name] ||
    definedValues[':where(html)'][name] ||
    defaultValues[name] ||
    getValueFromDefaultScopes(elementScopes, cssVar);

  const [
    showSelectors, setShowSelectors
  ] = useState(false);

  const [overwriteVariable, setOverwriteVariable] = useState(false);

  const toggleSelectors = () => setShowSelectors(!showSelectors);

  const valueFromScope = !scopes || !scopes[currentScope] ? null : scopes[currentScope][name];

  const value = valueFromScope || defaultValue;
  const isDefault = value === defaultValue;
  const {media} = maxSpecific || {};

  const varMatches = value && value.match(/^var\(\s*(\-\-[\w-]+)\s*[\,\)]/);
  const referencedVariable = useMemo(() => {
    return !varMatches || varMatches.length === 0
      ? null
      : allVars.find((cssVar) => cssVar.name === varMatches[1]) || {
          name: varMatches[1],
          usages: [
            {
              property: cssVar.usages[0].property,
              isFake: true,
            },
          ],
          properties: {},
          positions: [],
        };
  }, [value]);
  const {overridingMedia} = cssVar.allVar || cssVar;
  const matchesQuery =
    !media ||
    match(media, { type: 'screen', width: width || window.screen.width });
  const matchesScreen = matchesQuery && (!overridingMedia || !isOverridden({media, cssVar, width}));

  let currentLevel = referenceChain.length;
  const key = referenceChainKey(referenceChain, cssVar);

  const [
    isOpen, setIsOpen
    // Open all variables that refer to variables immediately.
  ] = useResumableState(initialOpen || (currentLevel > 0 && !!referencedVariable), `OPEN${key}`);

  const toggleOpen = () => setIsOpen(!isOpen );

  const excludedVarName = parentVar?.name;

  const references = useMemo(() => {
    // Prevent much unneeded work on large lists.
    if (!isOpen) {
      return null;
    }
    const regexp = new RegExp(
      `var\\(\\s*${cssVar.name.replaceAll(/-/g, "\\-")}[\\s\\,\\)]`
    );

    return allVars.filter(({ name, usages }) => {
      if (name === excludedVarName) {
        return false;
      }
      if (theme[name]) {
        return regexp.test(theme[name]);
      }
      if (definedValues[name]) {
        return regexp.test(definedValues[name]);
      }
      return regexp.test(usages[0].defaultValue);
    });
  }, [theme, excludedVarName, isOpen]);

  const [showReferences, setShowReferences] = useState(false);
  const [openVariablePicker, setOpenVariablePicker] = useState(false);

  const cssFunc = cssVar.usages.find((u) => u.cssFunc !== null)?.cssFunc;

  if (currentLevel > 20) {
    // Very long dependency chain, probably cyclic, let's break it here.
    // I'll prevent setting cyclic references in the first place.
    // Though this could also be an error in the source CSS.
    return null;
  }

  const isInTheme = name in theme || name in (scopes[currentScope] || {});

  return (
    <li
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
          {!!showCssProperties && <Fragment>
            {!!cssFunc && <span style={{color: 'darkcyan'}}>{cssFunc}</span>}
            {Object.entries(properties).map(([property, {isFullProperty, fullValue, isImportant}]) => (
              <span
                key={property}
                className="monospace-code"
                style={{ fontSize: '14px' }}
                title={
                  isFullProperty
                    ? ''
                    : fullValue
                }
              >
                {property}
                {!isFullProperty && <b style={{ color: 'red' }}>*</b>}
                {!!isImportant && <b style={{fontWeight: 'bold', color: 'darkorange'}}>!important</b>}
              </span>
            ))}
          </Fragment>}
        </div>
      </div>
      {!!positions[0] && <IdeLink {...(positions[0] || {})} />}
      {isOpen && (
        <Fragment>
          {references.length > 0 && (
            <div>
              <Checkbox
                title={references.map((r) => r.name).join('\n')}
                style={{ fontSize: '14px' }}
                controls={[showReferences, setShowReferences]}
              >
                Used by {references.length}
              </Checkbox>
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
            {isDefault && (
              <span
                style={{
                  margin: '6px 6px 0',
                  color: 'grey',
                }}
              >
                default{' '}
              </span>
            )}
            {isInTheme && (
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

            <button
              style={{borderWidth: openVariablePicker ? '4px' : '1px'}}
              onClick={(event) => {
              setOpenVariablePicker(!openVariablePicker);
              event.stopPropagation();
            }}>
              Link
            </button>

            {!usages[0].isFake && (
              <button onClick={toggleSelectors}>
                Selectors ({usages.length})
              </button>
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
              <TypedControl {...{ cssVar, value, onChange, cssFunc }} />
            </div>
          )}
          {!!referencedVariable && !overwriteVariable && (
            <ul style={{ margin: 0 }}>
              <VariableControl
                {...{ scopes: elementScopes }}
                cssVar={referencedVariable}
                onChange={(value) => {
                  dispatch({
                    type: ACTIONS.set,
                    payload: { name: referencedVariable.name, value },
                  });
                }}
                onUnset={() => {
                  dispatch({
                    type: ACTIONS.unset,
                    payload: { name: referencedVariable.name },
                  });
                }}
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
