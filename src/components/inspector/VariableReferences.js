import React, { useState } from "react";
import { get } from "../../state";
import { Checkbox } from "../controls/Checkbox";
import { ElementLocator } from "../ui/ElementLocator";
import { formatTitle } from "./VariableControl";

export function VariableReferences(props) {
  const { references } = props;
  const { annoyingPrefix, nameReplacements } = get;

  const [filterFound, setFilterFound] = useState(false);

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
          <li key={cssVar.name}>
            <div>
              {formatTitle(cssVar.name, annoyingPrefix, nameReplacements)}
            </div>
            <ElementLocator
              hideIfNotFound={filterFound}
              initialized
              selector={cssVar.usages.reduce((a, u) => a + u.selector, '')}
            >
            </ElementLocator>
          </li>
        ))}
      </ul>
    </div>
  );
}