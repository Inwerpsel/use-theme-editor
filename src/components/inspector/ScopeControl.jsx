import React from "react";
import { scopesByProperty } from "../../functions/collectRuleVars";
import { rootScopes } from "../../functions/extractPageVariables";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { ACTIONS, editTheme } from "../../hooks/useThemeEditor";
import { Checkbox } from "../controls/Checkbox";
import { ElementLocator } from "../ui/ElementLocator";
import { VariableControl } from "./VariableControl";

export function ScopeControl(props) {
    const { scopes, customProps, vars, element, editedProps } = props;
    const dispatch = editTheme();
    // Remove locator for now as it makes the UI jump too much.
    const [showLocator, setShowLocator] = useLocalStorage('show-scope-locators', false);
    // const showLocator = true;
    // const nonRootScopes = useMemo(() => {
    //     return scopes.filter(s => !rootScopes.includes(s.selector));
    // }, [scopes])

    if (scopes.length === 0) {
        return null;
    }

    const usedVars = [];

    return <div style={{ background: 'lightyellow', marginBottom: '24px', padding: '4px', border: '1px solid black' }}>
        <Checkbox controls={[showLocator, setShowLocator]} style={{float: 'right'}}>Find on page</Checkbox>
        <ul>
            {scopes.map(({ selector, matchingSelector, scopeVars }) => {
              const selectors = selector.split();

              // Scopes are already sorted by most specific first.
              // If a scope is completely overridden, don't show it.
              // if (!scopeVars.some((v) => !usedVars.includes(v))) {
              //   return null;
              // }

              usedVars.push(...scopeVars);

              const elementScopeVars = vars.filter((v) => v.currentScope === selector);

              if (elementScopeVars.length === 0) {
                return null;
              }

              return (
                <li
                  key={selector}
                  title={elementScopeVars
                    .map(
                      ({ name }) =>
                        `${name}: ${(scopesByProperty[name] || {})[selector]}`
                    )
                    .join('\n')}
                >
                  <span
                    style={{
                      border:  '1px solid gray',
                    }}
                    className="monospace-code"
                  >
                    {selectors.map((selector) => {
                      if (selector === matchingSelector) {
                        return <b key="selector">{selector}</b>;
                      }
                      return selector;
                    })}
                  </span>
                  {showLocator && !selector.includes(':root') && !selector.includes(':where(html)') && <ElementLocator
                    {...{ selector }}
                    initialized
                    // hideIfOne
                    showLabel={false}
                  />}
                  
                  <ul style={{marginBottom: '24px'}}>
                    {elementScopeVars
                      .map((cssVar) => (
                        <VariableControl
                          {...{
                            cssVar,
                            scopes,
                            customProps,
                            editedProps,
                            element,
                            currentScope: selector,
                          }}
                          initialOpen={false}
                          key={cssVar.name}
                          onChange={(value) => {
                            dispatch({
                              type: ACTIONS.set,
                              payload: {
                                name: cssVar.name,
                                value,
                                scope: selector,
                              },
                            });
                          }}
                          onUnset={() => {
                            dispatch({
                              type: ACTIONS.unset,
                              payload: { name: cssVar.name, scope: selector },
                            });
                          }}
                        />
                      ))}
                  </ul>
                </li>
              );
            })}
        </ul>
    </div>
}