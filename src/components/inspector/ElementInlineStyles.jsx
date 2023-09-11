import React, { useContext } from 'react';
import { ACTIONS } from '../../hooks/useThemeEditor';
import { ThemeEditorContext } from '../ThemeEditor';
import { VariableControl } from './VariableControl';

export function ElementInlineStyles(props) {
  const { dispatch } = useContext(ThemeEditorContext);
  const { group, elementScopes } = props;

  const styles = Object.entries(group.inlineStyles)

  if (styles.length === 0) {
      return null;
  }

  return <div>
      <h5 style={{color: 'red'}}>Inline styles</h5>
      <ul>
        {styles.map(([property, value]) => {
          if (typeof value === 'undefined') {
            return null;
          }
          const varMatches = value.match(/^var\(\s*(\-\-[\w-]+)\s*[\,\)]/);
          if (varMatches && varMatches.length > 0) {
            const name = varMatches[1];
            const cssVar = {
                name,
                usages: [
                  {
                    property,
                  },
                ],
                properties: {[property]: {isFullProperty: true, fullValue: value, isImportant: false}},
                maxSpecific: {property},
                positions: [],
            };

            return (
              <VariableControl
                key={cssVar.name}
                cssVar={cssVar}
                scopes={elementScopes}
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
              />
            );
          }
          return <li key={property}>
              <span className='monospace-code'>{property}: {value}</span>
              </li>;
        })}
      </ul>
  </div>
}