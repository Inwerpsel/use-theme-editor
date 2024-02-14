import React, { useContext, useState, useMemo, Fragment } from "react";
import { definedValues } from "../../functions/collectRuleVars";
import { ROOT_SCOPE } from "../../hooks/useThemeEditor";
import { Checkbox } from "../controls/Checkbox";
import { TextControl } from "../controls/TextControl";
import { PREVIEW_SIZE } from "../properties/ColorControl";
import { ThemeEditorContext } from "../ThemeEditor";
import { dragValue } from "../../functions/dragValue";

const rootSelectors = [':root', ':where(html)', 'html']

export function FilterableVariableList(props) {
    const {scopes} = useContext(ThemeEditorContext);
    const theme = scopes[ROOT_SCOPE] || {};
    const {value, onChange, elementScopes = []} = props;
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
          <TextControl 
            placeholder={`Filter name ${filtered.length}`}
            value={filter}
            onChange={setFilter}
          />
          <TextControl 
            placeholder={`Filter value ${filtered.length}`}
            value={filterValue}
            onChange={setFilterValue}
          />
        </div>
        <ul
          style={{
            maxHeight: '50vh',
            background: 'white',
            overflowY: 'scroll',
          }}
        >
          {filtered.map(([name, optionValue]) => {
              const varValue = `var(${name})`;
              const isCurrent = varValue === value;

              const insides = (
                <Fragment>
                  {name}
                  {/* Exclude some values that get too long. */}
                  {!/url\(|gradient\(/.test(optionValue) && (
                    <span style={{ maxWidth: '30%' }}>{optionValue}</span>
                  )}
                  <span
                    draggable
                    onDragStart={dragValue(varValue)}
                    key={name}
                    title={optionValue}
                    style={{
                      width: PREVIEW_SIZE,
                      height: PREVIEW_SIZE,
                      border: '1px solid black',
                      borderRadius: '6px',
                      background: `no-repeat left top/ cover ${optionValue}`,
                      float: 'right',
                      textShadow: 'white 0px 10px',
                      // backgroundSize: 'cover',
                    }}
                  >
                    {/var\(/.test(optionValue) && 'var'}
                  </span>{' '}
                </Fragment>
              );

              return (
                <li key={name}>
                  <button
                    onClick={() => {
                      !isCurrent && onChange(varValue);
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      border: isCurrent ? '4px solid black' : '1px solid black',
                    }}
                  >
                    {insides}
                  </button>

                </li>
              );
          })}
        </ul>
      </div>
    );
}