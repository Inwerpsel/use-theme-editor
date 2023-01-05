import React from 'react';
import { GroupControl } from "../inspector/GroupControl";

export function Inspector(props) {
    const {groups} = props;

    return (
      <ul className={'group-list'}>
        {groups.length === 0 && (
          <li>
            <span className="alert">No results</span>
          </li>
        )}
        {groups.map((group) => {
          return (
            <GroupControl
              key={group.label}
              {...{ group}}
            />
          );
        })}
      </ul>
    );
}