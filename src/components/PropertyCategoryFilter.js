import {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';
import {RadioControl, SelectControl} from '@wordpress/components';
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

export function PropertyCategoryFilter() {
  const {
    propertyFilter,
    setPropertyFilter,
  } = useContext(ThemeEditorContext);

  return <SelectControl
    className={'property-category-filter'}
    style={{
      display: 'inline',
    }}
    value={propertyFilter || 'all'}
    onChange={v => setPropertyFilter(v)}
    options={Object.entries(filters).map(([value, {label}]) => ({value, label}))}
  />;
}
