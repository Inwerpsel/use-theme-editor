import { useState, Fragment } from 'react';
import {TypedControl} from './TypedControl';
import { PSEUDO_REGEX, THEME_ACTIONS} from '../hooks/useThemeEditor';
import classnames from 'classnames';
import {COLOR_VALUE_REGEX, GRADIENT_REGEX} from './properties/ColorControl';
import {useLocalStorage} from '../hooks/useLocalStorage';

const uniqueUsages = cssVar => {
  const obj =  cssVar.usages.reduce((usages, usage) => ({
    ...usages,
    [usage.selector.replace(',', ',\n')]: usage,
  }), {});
  return Object.values(obj);
  // return [
  //   ...new Set(
  //     cssVar.usages.map(
  //       usage => usage.selector.replace(',', ',\n')
  //     )
  //   )
  // ];
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
const formatTitle = (cssVar) => {
  const [prefix, prop] = format(cssVar.name);
  return <Fragment>
    <span className={'var-control-property'}>{prop}</span>
    <br/>
    <div
      style={{
        fontSize: '13px',
        marginTop: '4px',
        marginLeft: '24px',
        fontStyle: 'italic',
        color: 'black'
      }}
    >{capitalize(prefix)}</div>
  </Fragment>;
};

const previewValue = (value, cssVar, onClick, isDefault) => {
  const size = '30px';

  const title = `${value}${ !isDefault ? '' : ' (default)' }`;

  if (value && `${value}`.match(COLOR_VALUE_REGEX) || `${value}`.match(GRADIENT_REGEX)) {
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
      } }/>;
  }

  return <span
    key={ 1 }
    onClick={ onClick }
    title={ title }
    style={ {
      // width: size,
      fontSize: '14px',
      height: size,
      float: 'right',
      marginTop: '2px'
    } }
  >
    { value }
  </span>;
};

const showUsages = (cssVar) => {
  return <ul>
    {uniqueUsages(cssVar).map(({selector, position}) => {
      const selectors = selector.split(',');
      if (selectors.length > 1 && selectors.some(selector => selector.length > 10)) {
        return <li key={selectors}>
          {!!position && <IdeLink {...position}/>}
          <ul
            style={{listStyleType: 'none'}}
          >{selectors.map(selector => <li key={selector}>{selector}</li>)}</ul>
        </li>;
      }

      return <li key={selectors}>{selector} {!!position && <IdeLink {...position}/>}</li>;
    })}
  </ul>;
};

const myBasePath = '/home/pieter/github/planet4-docker-compose/persistence/app/public/wp-content/';
const defaultReplacements = {
  'planet4-master-theme': myBasePath + 'themes/planet4-master-theme/',
  'planet4-plugin-gutenberg-blocks': myBasePath + 'plugins/planet4-plugin-gutenberg-blocks/',
};

function IdeLink(props) {
  const {
    source,
    line,
    generated: {sheet},
  } = props;
  const path = source.replace('webpack://', '');
  // No setter for now, enter manually in local storage.
  const [customReplacements] = useLocalStorage('repo-paths', null);

  let basePath;
  const replacements = customReplacements || defaultReplacements;
  for (const needle in replacements) {
    if (sheet.includes(needle)) {
      basePath = replacements[needle];
      break;
    }
  }
  if (!basePath) {
    return null;
  }

  // This protocol requires installing a handler on your system.
  return <a
    href={`phpstorm://open?file=${basePath.replace(/\/+$/, '') + '/' + path.replace(/^\//, '')}&line=${line}`}
    style={{color: 'blue', fontSize: '12px'}}
    onClick={e => e.stopPropagation()}
  >{path} {line}</a>;
}

export const VariableControl = (props) => {
  const {
    theme,
    cssVar,
    onChange,
    onUnset,
    defaultValue,
    dispatch,
    initialOpen,
  } = props;

  const [
    isOpen, setIsOpen
  ] = useState(initialOpen);

  const toggleOpen = () => setIsOpen(!isOpen);

  const [
    showSelectors, setShowSelectors
  ] = useState(false);

  const toggleSelectors = () => setShowSelectors(!showSelectors);
  const value = theme[cssVar.name] || defaultValue;
  const isDefault = value === defaultValue;

  return <li
    key={ cssVar.name }
    className={ classnames('var-control', {'var-control-in-theme': cssVar.name in theme }) }
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
    { previewValue(value, cssVar, toggleOpen, isDefault) }
    <h5
      style={ {  fontSize: '16px', padding: '2px 4px 0', fontWeight: '400', userSelect: 'none', cursor: 'pointer' } }
      onClick={ ()=> isOpen && toggleOpen() }
    >
      { formatTitle(cssVar) }
    </h5>
    {!!cssVar.positions[0] && <IdeLink {...(cssVar.positions[0] || {})}/>}
    { isOpen && (
      <div
        onMouseEnter={ () => {
          PSEUDO_REGEX.test(cssVar.name) && dispatch({
            type: THEME_ACTIONS.START_PREVIEW_PSEUDO_STATE,
            payload: { name: cssVar.name }
          });
        } }
        onMouseLeave={ () => {
          PSEUDO_REGEX.test(cssVar.name) && dispatch({
            type: THEME_ACTIONS.END_PREVIEW_PSEUDO_STATE,
            payload: { name: cssVar.name }
          });
        } }
      >
        { isDefault && <span style={{float: 'right', marginBottom: '14.5px', color: 'grey'}}>default</span>}
        { cssVar.name in theme && <button
          style={ { float: 'right', marginBottom: '14.5px' } }
          title={`Remove from current theme? The value from the default theme will be used, which is currently: "${defaultValue}"`}
          onClick={ () => {
            onUnset();
          } }
        >unset</button>}
        <br/>
        <TypedControl { ...{
          cssVar, theme, value, dispatch, onChange,
        } }/>
        <div>{cssVar.name}</div>
        <button onClick={toggleSelectors}>{ !showSelectors ? 'Show' : 'Hide'} selectors ({uniqueUsages(cssVar).length})</button>
        {showSelectors && showUsages(cssVar, showSelectors,toggleSelectors)}
      </div>
    ) }
  </li>;
};
