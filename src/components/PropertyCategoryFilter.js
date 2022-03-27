import {memo, useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';
import {SelectControl} from '@wordpress/components';
import {isColorProperty} from './TypedControl';

const filters = {
  all: {
    label: 'All',
  },
  colors: {
    label: 'Colors',
    test: isColorProperty,
  },
};

const WrappedSelectControl = ({propertyFilter,setPropertyFilter  }) => <SelectControl
  className={'property-category-filter'}
  style={{
    display: 'inline',
  }}
  value={propertyFilter || 'all'}
  onChange={v => setPropertyFilter(v)}
  options={Object.entries(filters).map(([value, {label}]) => ({value, label}))}
/>;

const MemoedSelectControl = memo(WrappedSelectControl);

export function PropertyCategoryFilter() {
  const {
    propertyFilter,
    setPropertyFilter,
  } = useContext(ThemeEditorContext);

  return <MemoedSelectControl {...{propertyFilter, setPropertyFilter}}/>;
}
