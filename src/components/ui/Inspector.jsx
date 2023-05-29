import React, { useMemo } from 'react';
import { filterSearched } from '../../functions/filterSearched';
import { get } from '../../state';
import { GroupControl } from "../inspector/GroupControl";
import { isColorProperty } from '../inspector/TypedControl';

export function Inspector(props) {
  const { unfilteredGroups } = props;
  const { propertyFilter, search } = get;

  const groups = useMemo(() => {
    const searched = filterSearched(unfilteredGroups, search);
    if (propertyFilter === 'all') {
      return searched;
    }
    return searched.map((group) => ({
      ...group,
      vars: group.vars.filter((cssVar) =>
        cssVar.usages.some((usage) => isColorProperty(usage.property))
      ),
    }));
  }, [unfilteredGroups, propertyFilter, search]);

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