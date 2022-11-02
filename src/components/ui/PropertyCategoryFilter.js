import React, {memo, useContext} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import {isColorProperty} from '../inspector/TypedControl';
import { SelectControl } from '../controls/SelectControl';

const filters = {
  all: {
    label: 'All',
  },
  colors: {
    label: 'Colors',
    test: isColorProperty,
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
  const {
    propertyFilter,
    setPropertyFilter,
  } = useContext(ThemeEditorContext);

  return <div style={{flexShrink: 0}}><MemoedSelectControl {...{propertyFilter, setPropertyFilter}}/></div>;
}
