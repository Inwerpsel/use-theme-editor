import React, { useMemo } from 'react';
import { filterSelectors, filterSearched } from '../../functions/filterSearched';
import { get } from '../../state';
import { GroupControl } from "../inspector/GroupControl";
import { isColorProperty } from '../inspector/TypedControl';

export function Inspector(props) {
  const { unfilteredGroups } = props;
  const {
    propertyFilter,
    search,
    filteredSelectors,
    showRawValues,
    excludedRawValues,
  } = get;

  const groups = useMemo(() => {
    const filteredBySelectors = filterSelectors(
      unfilteredGroups,
      filteredSelectors
    );
    const searched = filterSearched(filteredBySelectors, search);

    return searched.map((group) => ({
      ...group,
      vars: group.vars.filter((cssVar) => {
        if (
          (cssVar.isRawValue && !showRawValues) ||
          excludedRawValues.some((v) => cssVar.name === v)
        ) {
          return false;
        }
        if (propertyFilter === 'all') {
          return searched;
        }
        return cssVar.usages.some((usage) => isColorProperty(usage.property));
      }),
    }));
  }, [unfilteredGroups, propertyFilter, search, filteredSelectors]);

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