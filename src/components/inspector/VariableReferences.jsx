import React, { useState } from "react";
import { get } from "../../state";
import { Checkbox } from "../controls/Checkbox";
import { ElementLocator } from "../ui/ElementLocator";
import { formatTitle } from "./VariableControl";
import { dragValue } from "../../functions/dragValue";

export function VariableReferences(props) {
  const { references } = props;
  const { annoyingPrefix, nameReplacements } = get;

  const [filterFound, setFilterFound] = useState(true);

  if (references.length === 0) {
    return null;
  }

  return (
    <div style={{ marginLeft: '24px', marginTop: '8px' }}>
      <Checkbox
        title={'Show only elements that were found on the page '}
        controls={[filterFound, setFilterFound]}
      >
        Filter found
      </Checkbox>
      <ul style={{ marginTop: '0' }}>
        {references.map((cssVar) => (
          <li key={cssVar.name} style={{borderBottom: '1px solid gray'}}>
            <div
              draggable
              onDragStart={dragValue(() => `var(${cssVar.name})`)}
            >
              {formatTitle(cssVar.name, annoyingPrefix, nameReplacements)}
            </div>
            <ElementLocator
              hideIfNotFound={filterFound}
              initialized
              // Quick fix, this won't be needed once inspection is rewritten.
              selector={cssVar.usages.reduce((a, u) => a + ',' + u.selector, '').replace(/^,/,'')}
            >
            </ElementLocator>
          </li>
        ))}
      </ul>
    </div>
  );
}