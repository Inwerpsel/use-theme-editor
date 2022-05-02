import React, {useContext, useMemo, useState} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {VariableControl} from '../inspector/VariableControl';
import {ACTIONS} from '../../hooks/useThemeEditor';
import {Checkbox} from '../controls/Checkbox';
import {ElementLocator} from './ElementLocator';
import {ToggleButton} from '../controls/ToggleButton';
import {allStateSelectorsRegexp} from '../../functions/getMatchingVars';
import {useLocalStorage} from '../../hooks/useLocalStorage';

export function CurrentTheme() {
  const {
    theme,
    dispatch,
    allVars,
    // propertyFilter,
    // propertySearch,
  } = useContext(ThemeEditorContext);
  const [initialized, setInitialized] = useState(false);

  const [showObsolete, setShowObsolete] = useState(true);
  const [showActive, setShowActive] = useState(true);

  const [isOpen, setIsOpen] = useLocalStorage('current-theme-open', true);

  // const cleanedTheme = useMemo(() => {
  //   return Object.entries(theme).reduce((cleanedTheme, [k, v]) => {
  //     if (!allVars.find(allVar => allVar.name === k)) {
  //       return cleanedTheme;
  //     }
  //     return {
  //       ...cleanedTheme,
  //       [k]: v,
  //     };
  //   }, {});
  // }, [theme]);
  const UNFOUND = 'UNFOUND';

  const groupedBySelector = useMemo(() => {
    if (!isOpen) {
      return {};
    }
    return Object.keys(theme).reduce((grouped, k) => {
      const cssVar = allVars.find(allVar => allVar.name === k);
      if (!cssVar) {
        if (!grouped[UNFOUND]) {
          grouped[UNFOUND] = [];
        }
        grouped[UNFOUND].push({name: k});
        return grouped;
      }

      const selector = [...new Set(cssVar.usages.map(usage => usage.selector))]
        .join()
        .replace(allStateSelectorsRegexp, '')
        .replace(/:?:(before|after)/g, '');
      if (!grouped[selector]) {
        grouped[selector] = [];
      }
      grouped[selector].push(cssVar);

      return grouped;
    }, {});
  }, [theme, isOpen]);

  return <div>
    <h2>Current theme ({Object.keys(theme).length})</h2>
    <Checkbox controls={[showActive, setShowActive]}>
      Show active
    </Checkbox>
    <Checkbox controls={[showObsolete, setShowObsolete]}>
      Show obsolete
    </Checkbox>
    <ToggleButton controls={[initialized, setInitialized]}>INIT {initialized ? '' : '*'}</ToggleButton>
    <ToggleButton controls={[isOpen, setIsOpen]}>{isOpen ? 'Close' : 'Open'}</ToggleButton>
    {isOpen && <ul
      style={{
        background: 'white',
        listStyleType: 'none',
        paddingLeft: 0,
      }}
    >
      {Object.entries(groupedBySelector).map(([selector, cssVars]) => <li key={selector}>
        <ElementLocator {...{initialized, selector}}/>
        <ul>
          {cssVars.map(cssVar => {
            const k = cssVar.name;

            if (selector === UNFOUND && showObsolete) {
              return <li key={k}>
                <p>
                  <em>{k}</em> was not found.
                  <button
                    onClick={() => {
                      dispatch({type: ACTIONS.unset, payload: {name: k}});
                    }}
                  >unset</button>
                </p>
              </li>;
            }

            if (!showActive || selector === UNFOUND) {
              return null;
            }

            return <VariableControl
              key={k}
              onChange={value => {
                dispatch({type: ACTIONS.set, payload: {name: cssVar.name, value}});
              }}
              onUnset={() => {
                dispatch({type: ACTIONS.unset, payload: {name: cssVar.name}});
              }}
              {...{
                cssVar,
              }}/>;
          })}
        </ul>
      </li>)}
    </ul>}
  </div>;
}
