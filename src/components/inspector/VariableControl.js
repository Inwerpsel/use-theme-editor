import React, {useState, Fragment, useContext} from 'react';
import {isColorProperty, TypedControl} from './TypedControl';
import { PSEUDO_REGEX, ACTIONS} from '../../hooks/useThemeEditor';
import classnames from 'classnames';
import {PREVIEW_SIZE} from '../properties/ColorControl';
import mediaQuery from 'css-mediaquery';
import {isOverridden, VariableScreenSwitcher} from './VariableScreenSwitcher';
import {ThemeEditorContext} from '../ThemeEditor';
import {IdeLink} from './IdeLink';
import {ElementLocator} from '../ui/ElementLocator';
import { definedValues, scopesByProperty } from '../../functions/collectRuleVars';
import { allStateSelectorsRegexp } from '../../functions/getMatchingVars';

const uniqueUsages = usages => {
  const obj =  usages.reduce((usages, usage) => ({
    ...usages,
    [usage.selector.replace(',', ',\n')]: usage,
  }), {});
  return Object.values(obj);
};

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);
const format = name => {
  // todo: make this make more sense
  const raw = name.replace(/^--/, '').replace(/--/g, ': ').replace(/[-_]/g, ' ');
  const parts = raw.split(':');

  return [
    parts.slice(0, parts.length - 1).join(' — '),
    parts[parts.length - 1].trim().replace(/ /g, '-')
  ];
};
const formatTitle = (name) => {
  const [prefix, prop] = format(name);
  return <Fragment>
    <div
      style={{
        fontSize: '13px',
        fontStyle: 'italic',
        color: 'black'
      }}
    >{capitalize(prefix)}</div>
    <span className={'var-control-property'}>{prop}</span>
  </Fragment>;
};

const previewValue = (value, cssVar, onClick, isDefault) => {
  const size = PREVIEW_SIZE;

  const title = `${value}${ !isDefault ? '' : ' (default)' }`;

  const shouldBeColor = isColorProperty(cssVar.usages[0].property);

  if (value && shouldBeColor) {
    return <span
      key={ 1 }
      onClick={ onClick }
      title={ title }
      style={ {
        width: size,
        height: size,
        border: '1px solid black',
        borderRadius: '6px',
        background: value,
        float: 'right',
        marginTop: '7px',
      } }>{/^var\(/.test(value) && 'var'}</span>;
  }

  return <span
    key={ 1 }
    onClick={ onClick }
    title={ title }
    style={ {
      // width: size,
      fontSize: '14px',
      float: 'right',
      marginTop: '2px'
    } }
  >
    { value }
  </span>;
};

const showUsages = usages => {
  return <ul>
    {uniqueUsages(usages).map(({property, selector, position}) => {
      const selectors = selector.split(',');
      if (selectors.length > 1 && selectors.some(selector => selector.length > 10)) {
        return <li key={selectors}>
          {!!position && <IdeLink {...position}/>}
          <ul
            style={{listStyleType: 'none'}}
          >
            {selectors.map(selector => <li key={selector}>
              <span> ({property})</span>
              <ElementLocator selector={selector.replace(allStateSelectorsRegexp, '')} initialized={true}/>
            </li>)}
          </ul>
        </li>;
      }

      return <li key={selectors}>
        {!!position && <IdeLink {...position}/>}
        <span> ({property})</span>
        <ElementLocator selector={selector.replace(allStateSelectorsRegexp, '')} initialized={true}/>
      </li>;
    })}
  </ul>;
};

export const VariableControl = (props) => {
  const {
    cssVar,
    onChange,
    onUnset,
    initialOpen,
    nestingLevel,
  } = props;

  const {
    theme,
    dispatch,
    width,
    defaultValues,
    allVars,
  } = useContext(ThemeEditorContext);

  const {
    name,
    usages,
    maxSpecific,
    positions,
    properties,
  } = cssVar;

  const defaultValue = definedValues[':root'][name] || defaultValues[name];

  const [
    isOpen, setIsOpen
  ] = useState(initialOpen);

  const toggleOpen = () => setIsOpen(!isOpen);

  const [
    showSelectors, setShowSelectors
  ] = useState(false);

  const [overwriteVariable, setOverwriteVariable] = useState(false);

  const toggleSelectors = () => setShowSelectors(!showSelectors);
  const value = theme[name] || defaultValue;
  const isDefault = value === defaultValue;
  const {media} = maxSpecific || {};

  const varMatches = value && value.match(/^var\((\-\-[\w-]+)\s*[\,\)]/);
  const referencedVariable = !varMatches || varMatches.length === 0 
    ? null 
    : allVars.find(cssVar => cssVar.name === varMatches[1].trim());

  const screen = {type: 'screen', width: width || window.screen.width};
  const {overridingMedia} = cssVar.allVar || cssVar;
  const matchesQuery = !media || mediaQuery.match(media, screen);
  const matchesScreen = matchesQuery && (!overridingMedia || !isOverridden({media, cssVar, width: width}));

  const isAffectedByScope = !!scopesByProperty[name] && (
    scopesByProperty[name].length > 1 || Object.keys(scopesByProperty[name])[0] !== ':root'
  );

  let currentLevel = nestingLevel || 0;

  if (nestingLevel > 20) {
    // Very long dependency chain, probably cyclic, let's break it here.
    // I'll prevent setting cyclic references in the first place.
    return null;
  }

  return <li
    key={ name }
    className={classnames(
      'var-control',
      {
        'var-control-in-theme': name in theme,
        'var-control-no-match-screen': !matchesScreen,
      },
    )}
    onClick={ () => !isOpen && toggleOpen()}
    style={ {
      // userSelect: 'none',
      position: 'relative',
      listStyleType: 'none',
      fontSize: '15px',
      clear: 'both',
      cursor: isOpen ? 'auto' : 'pointer',
    } }
  >
    {!matchesScreen && <VariableScreenSwitcher {...{cssVar, media}}/>}
    { previewValue(value, cssVar, toggleOpen, isDefault) }
    <div
        onClick={ ()=> isOpen && toggleOpen() }
    >
      <div>
        {isAffectedByScope && <span
          style={{
            fontSize: '24px',
            color: 'red',
            fontWeight: 'bold',
          }}
          title={
            'Property declared in a CSS selector, global overrides likely ineffective.\n'
            + Object.entries(scopesByProperty[name]).map(([k,v])=> `${k}: ${v}`).join('\n')
          }
        >
          !&nbsp;
        </span>}

        {Object.entries(properties).map(([property, isFullProperty]) => <span
          key={property}
          className='monospace-code'
          style={{ fontSize: '14px' }}
          title={isFullProperty ? '' : 'Does not set whole property! Most inputs likely will not work.'}
        >{property}{!isFullProperty && <b style={{color: 'red'}}> *</b>}</span>)}

      </div>
      
      <h5
        style={ {  fontSize: '16px', padding: '2px 4px 0', fontWeight: '400', userSelect: 'none', cursor: 'pointer' } }
      >
        { formatTitle(name) }
      </h5>
    </div>
    {!!positions[0] && <IdeLink {...(positions[0] || {})}/>}
    { isOpen && <Fragment>
      { !!referencedVariable && <ul><VariableControl
        cssVar={referencedVariable}
        onChange={(value) => {
          dispatch({type: ACTIONS.set, payload: {name: referencedVariable.name, value}})
        }}
        onUnset={() => {
          dispatch({type: ACTIONS.unset, payload: {name: referencedVariable.name}})
        }}
        initialOpen={false}
        nestingLevel={++currentLevel}
      /></ul>}
      {referencedVariable && <button
        onClick={() => {setOverwriteVariable(!overwriteVariable)}}
      >{overwriteVariable? 'Close custom color' : 'Use custom color'}</button>}
      { (!referencedVariable || overwriteVariable) && <div
        onMouseEnter={ () => {
          PSEUDO_REGEX.test(name) && dispatch({
            type: ACTIONS.startPreviewPseudoState,
            payload: { name }
          });
        } }
        onMouseLeave={ () => {
          PSEUDO_REGEX.test(name) && dispatch({
            type: ACTIONS.endPreviewPseudoState,
            payload: { name }
          });
        } }
      >
        { name in theme && <button
          style={ { float: 'right', marginBottom: '14.5px', fontSize: '12px' } }
          title={`Remove from current theme? The value from the default theme will be used, which is currently: "${defaultValue}"`}
          onClick={ () => {
            onUnset();
          } }
        >unset</button>}
        { isDefault && <span style={{float: 'right', margin: '6px 6px 15px', color: 'grey'}}>default </span>}
        <br/>
        <TypedControl {...{cssVar, value, onChange}}/>
      </div>}
      <div>
        <button
          onClick={toggleSelectors}
          style={{fontSize: '15px', marginTop: '8px'}}
        >{ !showSelectors ? 'Show' : 'Hide'} selectors ({uniqueUsages(usages).length})
        </button>
      </div>
      {showSelectors && <Fragment>
        <div>{name}</div>
        {showUsages(uniqueUsages(usages))}
      </Fragment>}
    </Fragment> }
  </li>;
};
