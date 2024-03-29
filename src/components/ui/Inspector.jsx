import React, { useEffect, useMemo, useRef } from 'react';
import { filterSelectors, filterSearched } from '../../functions/filterSearched';
import { get } from '../../state';
import { GroupControl } from "../inspector/GroupControl";
import { mustBeColor } from '../inspector/TypedControl';

export function Inspector(props) {
  const { unfilteredGroups, inspectedIndex, currentInspected } = props;
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
          return true;
        }
        return mustBeColor(cssVar);
      }),
    }));
  }, [unfilteredGroups, propertyFilter, search, filteredSelectors]);

  const ref = useRef();
  useEffect(() => {
    // A bit shaky but should work at least for now.
    // After the inspection is rewritten this will probably be easier to deal with.
    // This should run whenever a new inspection is done.
    if (inspectedIndex > currentInspected) {
      const el = ref.current;
      setTimeout(() => {
        el?.scrollIntoView({block: 'start'});
      }, 10)
    }
  }, [inspectedIndex])

    return (
      <ul className={'group-list'} {...{ref}}>
        {groups.length === 0 && (
          <li>
            <span className="alert">No results</span>
          </li>
        )}
        {groups.map((group) => (
          <GroupControl key={group.label} {...{ group }} />
        ))}
      </ul>
    );
}