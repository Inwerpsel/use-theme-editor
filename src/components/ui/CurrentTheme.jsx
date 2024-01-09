import React, {useContext, useMemo, useState} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {VariableControl} from '../inspector/VariableControl';
import {ACTIONS} from '../../hooks/useThemeEditor';
import {Checkbox} from '../controls/Checkbox';
import {ElementLocator} from './ElementLocator';
import {ToggleButton} from '../controls/ToggleButton';
import {useLocalStorage} from '../../hooks/useLocalStorage';
import {varMatchesTerm} from '../../functions/filterSearched';
import {mustBeColor} from '../inspector/TypedControl';
import { get } from '../../state';
import { definedValues } from '../../functions/collectRuleVars';

export function CurrentTheme() {
  const { propertyFilter, search } = get;
  const {
    scopes,
    dispatch,
    allVars,
    defaultValues,
  } = useContext(ThemeEditorContext);
  const [initialized, setInitialized] = useState(false);

  const [showObsolete, setShowObsolete] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [hideNotFound, setHideNotFound] = useState(true);

  const [isOpen, setIsOpen] = useLocalStorage('current-theme-open', false);
  const UNFOUND = 'UNFOUND';

  // Also filters.
  const groupedBySelector = useMemo(() => {
    if (!isOpen) {
      return {};
    }


    return Object.keys(defaultValues).reduce((grouped, k) => {
      const cssVar = allVars.find(allVar => allVar.name === k);
      const term = search.replace(/^\!/, '');
      const isInverse = term.length !== search.length
      if (!cssVar) {
        if (term && k.replace(/-+/g, ' ').match(term) || isInverse) {
          return grouped;
        }
        if (!grouped[UNFOUND]) {
          grouped[UNFOUND] = [];
        }
        grouped[UNFOUND].push({name: k});
        return grouped;
      }

      if (!varMatchesTerm(cssVar, term) || isInverse) {
        return grouped;
      }

      if (propertyFilter !== 'all' && !mustBeColor(cssVar)) {
        return grouped;
      }

      const selector = cssVar.statelessSelector.replace(/,\s\:where.*\*$/, '');

      if (!grouped[selector]) {
        grouped[selector] = [];
      }
      grouped[selector].push(cssVar);

      return grouped;
    }, {});
  }, [scopes, isOpen, propertyFilter, search]);

  return (
    <div>
      <h4>
        {/* Current theme ({Object.keys(theme).length} out of{' '} */}
        {Object.keys(defaultValues).length})
        <ToggleButton style={{ float: 'right' }} controls={[isOpen, setIsOpen]}>
          {isOpen ? 'Close' : 'Open'}
        </ToggleButton>
      </h4>

      {isOpen && (
        <div>
          <Checkbox controls={[showActive, setShowActive]}>
            Show active
          </Checkbox>
          <Checkbox controls={[showObsolete, setShowObsolete]}>
            Show unknown
          </Checkbox>
          <Checkbox controls={[hideNotFound, setHideNotFound]}>
            Hide not found
          </Checkbox>
          <ToggleButton controls={[initialized, setInitialized]}>
            INIT {initialized ? '' : '*'}
          </ToggleButton>
        </div>
      )}
      {isOpen && (
        <ul
          style={{
            background: 'white',
            listStyleType: 'none',
            paddingLeft: 0,
          }}
        >
          {Object.entries(groupedBySelector).map(([selector, cssVars]) => (
            <li style={{ marginTop: '12px' }} key={selector}>
              <ElementLocator
                hideIfNotFound={hideNotFound}
                {...{ initialized, selector }}
              >
                <ul>
                  {cssVars.map((cssVar) => {
                    const k = cssVar.name;

                    if (selector === UNFOUND && showObsolete) {
                      return (
                        <li key={k}>
                          <p>
                            <em>{k}</em> was not found.
                            <button
                              onClick={() => {
                                dispatch({
                                  type: ACTIONS.unset,
                                  payload: { name: k },
                                });
                              }}
                            >
                              unset
                            </button>
                          </p>
                        </li>
                      );
                    }

                    if (!showActive || selector === UNFOUND) {
                      return null;
                    }

                    return (
                      <VariableControl
                        key={k}
                        onChange={(value) => {
                          dispatch({
                            type: ACTIONS.set,
                            payload: { name: cssVar.name, value },
                          });
                        }}
                        onUnset={() => {
                          dispatch({
                            type: ACTIONS.unset,
                            payload: { name: cssVar.name },
                          });
                        }}
                        {...{
                          cssVar,
                        }}
                      />
                    );
                  })}
                </ul>
              </ElementLocator>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
