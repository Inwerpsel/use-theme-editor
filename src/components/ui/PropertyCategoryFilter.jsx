import React, {memo} from 'react';
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

const WrappedSelectControl = ({propertyFilter, setPropertyFilter}) => <SelectControl
  className={'property-category-filter'}
  title={'Filter by category'}
  value={propertyFilter || 'all'}
  onChange={setPropertyFilter}
  {...{
    options,
  }}
/>;

const MemoedSelectControl = memo(WrappedSelectControl);

export function PropertyCategoryFilter() {
  const [ propertyFilter, setPropertyFilter ] = use.propertyFilter();

  return <div style={{flexShrink: 0}}><MemoedSelectControl {...{propertyFilter, setPropertyFilter}}/></div>;
}
