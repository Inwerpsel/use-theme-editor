import React, { Fragment, useEffect, useMemo, useRef } from 'react';
import { filterSelectors, filterSearched } from '../../functions/filterSearched';
import { get } from '../../state';
import { GroupControl } from "../inspector/GroupControl";
import { mustBeColor } from '../inspector/TypedControl';
import { Tutorial } from '../../_unstable/Tutorial';

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

    return <Fragment>
      <Tutorial el={Inspector}>
        <p>
          The appearance of each element is determined by rules. These rules can be attached to the element itself, or to one of its parents.
        </p>
        <p>
          They are grouped in a box per element. You can hover the title of the box to highlight the corresponding element on the page.
        </p>
        <p>
          You can think of it as a tree view, except:
          <ul style={{paddingLeft: '48px'}}>
            <li>It's upside down, so that the most useful information is easy to find</li>
            <li>Doesn't include the whole tree, only the section leading to the inspected element.</li>
            <li>Everything related to the element is here, so it's always obvious what applies to what</li>
          </ul>
        </p>
      </Tutorial>
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
    </Fragment>;
}

Inspector.fName = 'Inspector';