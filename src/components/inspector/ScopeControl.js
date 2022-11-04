import React, { useContext, useMemo, useState } from "react";
import { scopesByProperty } from "../../functions/collectRuleVars";
import { rootScopes } from "../../functions/extractPageVariables";
import { ACTIONS } from "../../hooks/useThemeEditor";
import { ThemeEditorContext } from "../ThemeEditor";
import { ElementLocator } from "../ui/ElementLocator";
import { VariableControl } from "./VariableControl";

export function ScopeControl(props) {
    const { dispatch } = useContext(ThemeEditorContext);
    // const [showLocator, setShowLocator] = useState(false);
    const showLocator = true;

    const { scopes, vars, element } = props;

    const nonRootScopes = useMemo(() => {
        return scopes.filter(s => !rootScopes.includes(s.selector));
    }, [scopes])

    if (nonRootScopes.length === 0) {
        return null;
    }

    const usedVars = [];

    return <div style={{ background: 'lightyellow', marginBottom: '24px', padding: '4px', border: '1px solid black' }}>
        <h5>Variations</h5>
        <ul>
            {nonRootScopes.map(({ selector, matchingSelector, scopeVars }) => {
              const selectors = selector.split();

              // Scopes are already sorted by most specific first.
              // If a scope is completely overridden, don't show it.
              if (!scopeVars.some((v) => !usedVars.includes(v))) {
                return null;
              }

              usedVars.push(...scopeVars);

              const elementScopeVars = vars.filter((v) => v.currentScope === selector);

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
                  {/* {showLocator && <ElementLocator
                    {...{ selector }}
                    initialized
                    // hideIfOne
                    showLabel={false}
                  />} */}
                  
                  <ul style={{marginBottom: '24px'}}>
                    {elementScopeVars
                      .map((cssVar) => (
                        <VariableControl
                          {...{
                            cssVar,
                            scopes,
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