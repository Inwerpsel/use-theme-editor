import React from "react";
import { scopesByProperty } from "../../functions/collectRuleVars";

export function ScopeControl(props) {
    const { scopes } = props;

    if (scopes.length === 0) {
        return null;
    }

    return <div style={{ background: 'lightyellow', marginBottom: '24px', padding: '4px' }}>
        <h5>Affected by scopes:</h5>
        <ul>
            {scopes.map(({ selector, matchingSelector, scopeVars }) => {
                const selectors = selector.split();
                return <li
                    key={selector}
                    title={scopeVars.map(({name}) => `${name}: ${scopesByProperty[name][selector]}`).join('\n')}
                >
                    <span className="monospace-code">
                        {selectors.map(selector => {
                            if (selector === matchingSelector) {
                                return <b key='selector'>{selector}</b>
                            }
                            return selector;
                        })}
                    </span>
                </li>;
            })}
        </ul>
    </div>

}