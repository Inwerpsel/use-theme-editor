import React, {useContext, useMemo, useState} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {VariableControl} from '../inspector/VariableControl';
import {ACTIONS} from '../../hooks/useThemeEditor';
import {Checkbox} from '../controls/Checkbox';
import {ElementLocator} from './ElementLocator';
import {ToggleButton} from '../controls/ToggleButton';
import {allStateSelectorsRegexp} from '../../functions/getMatchingVars';
import {useLocalStorage} from '../../hooks/useLocalStorage';
import {varMatchesTerm} from '../../functions/filterSearched';
import {isColorProperty} from '../inspector/TypedControl';

export function CurrentTheme() {
  const {
    theme,
    dispatch,
    allVars,
    defaultValues,
    propertyFilter,
    propertySearch,
  } = useContext(ThemeEditorContext);
  const [initialized, setInitialized] = useState(false);

  const [showObsolete, setShowObsolete] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [useDefaultValues, setUseDefaultValues] = useState(false);
  const [hideNotFound, setHideNotFound] = useState(false);

  const [isOpen, setIsOpen] = useLocalStorage('current-theme-open', true);
  const UNFOUND = 'UNFOUND';

  const groupedBySelector = useMemo(() => {
    if (!isOpen) {
      return {};
    }

    const base = !useDefaultValues ? theme : {...defaultValues, ...theme};

    return Object.keys(base).sort().reduce((grouped, k) => {
      const cssVar = allVars.find(allVar => allVar.name === k);
      if (!cssVar) {
        if (propertySearch && k.replace(/-+/g, ' ').match(propertySearch)) {
          return grouped;
        }
        if (!grouped[UNFOUND]) {
          grouped[UNFOUND] = [];
        }
        grouped[UNFOUND].push({name: k});
        return grouped;
      }

      if (!varMatchesTerm(cssVar, propertySearch)) {
        return grouped;
      }

      if (propertyFilter !== 'all' && !cssVar.usages.some(usage => isColorProperty(usage.property))) {
        return grouped;
      }

      const selector = [...new Set(cssVar.usages.map(usage => usage.selector))]
        .join()
        .replace(allStateSelectorsRegexp, '')
        .replace(/:?:(before|after)/g, '')
        .split(',')
        .map(s=>s.trim())
        .filter((value,index,self) => self.indexOf(value) === index)
        .join();

      if (!grouped[selector]) {
        grouped[selector] = [];
      }
      grouped[selector].push(cssVar);

      return grouped;
    }, {});
  }, [theme, isOpen, useDefaultValues, propertyFilter, propertySearch]);

  return <div>
    <h4>
      Current theme ({Object.keys(theme).length})
      <ToggleButton style={{float: 'right'}} controls={[isOpen, setIsOpen]}>{isOpen ? 'Close' : 'Open'}</ToggleButton>
    </h4>

    {isOpen && <div>
      <Checkbox controls={[showActive, setShowActive]}>
        Show active
      </Checkbox>
      <Checkbox controls={[showObsolete, setShowObsolete]}>
        Show obsolete
      </Checkbox>
      <Checkbox controls={[useDefaultValues, setUseDefaultValues]}>
        Include default values
      </Checkbox>
      <Checkbox controls={[hideNotFound, setHideNotFound]}>
        Hide not found
      </Checkbox>
      <ToggleButton controls={[initialized, setInitialized]}>INIT {initialized ? '' : '*'}</ToggleButton>
    </div>}
    {isOpen && <ul
      style={{
        background: 'white',
        listStyleType: 'none',
        paddingLeft: 0,
      }}
    >
      {Object.entries(groupedBySelector).map(([selector, cssVars]) => <li key={selector}>
        <ElementLocator hideIfNotFound={hideNotFound} {...{initialized, selector}}>
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
        </ElementLocator>
      </li>)}
    </ul>}
  </div>;
}
