import React, { useContext, useState, useMemo, Fragment } from "react";
import { definedValues } from "../../functions/collectRuleVars";
import { rootScopes } from "../../functions/extractPageVariables";
import { ROOT_SCOPE } from "../../hooks/useThemeEditor";
import { Checkbox } from "../controls/Checkbox";
import { PREVIEW_SIZE } from "../properties/ColorControl";
import { ThemeEditorContext } from "../ThemeEditor";

const rootSelectors = [':root', ':where(html)', 'html']

export function FilterableVariableList(props) {
    const {scopes} = useContext(ThemeEditorContext);
    const theme = scopes[ROOT_SCOPE] || {};
    const {onChange, elementScopes = []} = props;
    const [filter, setFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [includeRoot, setIncludeRoot] = useState(true);

    const filtered = useMemo(() => {
        const fromDefinedValues = Object.entries(definedValues)
        .reduce((all, [selector, vars]) => {
            if (elementScopes.some(s => s.selector === selector) || (includeRoot && rootSelectors.includes(selector))) {
                for (const key in vars) {
                    all[key] = vars[key];
                }
            }

            return all;
        }, {})

        const base = {...fromDefinedValues, ...theme};

        return Object.entries(base).filter(
          ([name, value]) =>
            typeof value !== 'undefined' &&
            value !== '' &&
            (!filter || new RegExp(filter.replaceAll(' ', '(\\-\\-?| )')).test(name)) &&
            (!filterValue || new RegExp(filterValue.replaceAll(' ', '(\\-\\-?| )')).test(value))
        );
    }, [filter, filterValue, theme, includeRoot]);

    return (
      <div onClick={(e) => e.stopPropagation()} style={{}}>
        <Checkbox controls={[includeRoot, setIncludeRoot]}>Global values</Checkbox>
        <div style={{ display: 'flex', width: '100%' }}>
          <input
            autoCapitalize={false}
            type="text"
            placeholder="Filter name..."
            value={filter}
            onChange={({ target: { value } }) => setFilter(value)}
          />
          <input
            type="text"
            placeholder={`Filter value ${filtered.length}`}
            value={filterValue}
            onChange={({ target: { value } }) => setFilterValue(value)}
          />
        </div>
        <ul
          style={{
            maxHeight: '50vh',
            background: 'white',
            overflowY: 'scroll',
          }}
        >
          {filtered.map(([name, value]) => {
            const varValue = `var(${name})`;
              const isCurrent =  varValue === value;

              const insides = (
                <Fragment>
                  {name}
                  {/* Exclude some values that get too long. */}
                  {!/url\(|gradient\(/.test(value) && (
                    <span style={{ maxWidth: '30%' }}>{value}</span>
                  )}
                  <span
                    key={name}
                    title={value}
                    style={{
                      width: PREVIEW_SIZE,
                      height: PREVIEW_SIZE,
                      border: '1px solid black',
                      borderRadius: '6px',
                      background: `no-repeat left top/ cover ${value}`,
                      float: 'right',
                      textShadow: 'white 0px 10px',
                      // backgroundSize: 'cover',
                    }}
                  >
                    {/var\(/.test(value) && 'var'}
                  </span>{' '}
                </Fragment>
              );

              return (
                <li key={name}>
                  {isCurrent && <div>{insides}</div>}

                  {!isCurrent && (
                    <button
                      onClick={() => {
                        onChange(varValue);
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      {insides}
                    </button>
                  )}
                </li>
              );
          })}
        </ul>
      </div>
    );
}