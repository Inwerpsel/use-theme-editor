import React from 'react';
import { SelectControl } from '../controls/SelectControl';
import { use } from '../../state';

const filters = {
  all: {
    label: 'All',
  },
  colors: {
    label: 'Colors',
  },
};

const options = Object.entries(filters).map(([value, {label}]) => ({value, label}));

export function PropertyCategoryFilter() {
  const [ propertyFilter, setPropertyFilter ] = use.propertyFilter();

  return (
    <SelectControl
      className={'property-category-filter'}
      title={'Filter by category'}
      value={propertyFilter || 'all'}
      onChange={setPropertyFilter}
      {...{
        options,
      }}
    />
  );
}
