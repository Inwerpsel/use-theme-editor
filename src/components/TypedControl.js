import {SelectControl, TextControl} from '@wordpress/components';
import {Fragment} from 'react';
import {ShadowPicker} from 'react-shadow-picker';
import {FontFamilyControl} from './properties/FontFamilyControl';
import {ColorControl} from './properties/ColorControl';
import {SizeControl, sizeLikeProperties} from './properties/SizeControl';

const valuesAsLabels = value => ({value: `${value}`, label: `${value}`});

export const TypedControl = ({ cssVar, theme, value, onChange, dispatch }) => {

  if (cssVar.usages.some(usage =>
    !!usage.property.match(/color$/)
    || ['background', 'fill', 'stroke'].includes(usage.property)
  )) {
    return <ColorControl {...{onChange, value, theme, cssVar, dispatch}}/>;
  }

  if (cssVar.usages.some(usage => sizeLikeProperties.includes(usage.property))) {

    return <SizeControl{...{value, onChange}}/>;
  }

  if (cssVar.usages.some(usage => usage.property === 'font-weight')) {
    const numbers = ['', 100, 200, 300, 400, 500, 600, 700, 800, 900].map(valuesAsLabels);
    const constants = ['', 'normal', 'bold', 'lighter', 'bolder'].map(valuesAsLabels);

    return <Fragment>
      <SelectControl
        {...{value, onChange}}
        options={numbers}
      />
      <SelectControl
        {...{value, onChange}}
        options={constants}
      />
    </Fragment>;
  }

  if (cssVar.usages.some(usage => usage.property === 'font-style')) {
    const options = ['normal', 'italic'].map(valuesAsLabels);
    return <SelectControl
      {...{value, onChange, options}}
    />;
  }

  if (cssVar.usages.some(usage => usage.property === 'font-family')) {
    return <FontFamilyControl {...{value, onChange}}/>;
  }

  if ( cssVar.usages.some( usage => usage.property === 'box-shadow' ) ) {
    return <ShadowPicker {...{value, onChange}}/>;
  }

  if ( cssVar.usages.some( usage => usage.property === 'display' ) ) {
    const options = ['none', 'inline', 'inline-block', 'block', 'flex'].map(valuesAsLabels);
    return <SelectControl
      {...{value, onChange, options}}
    />;
  }

  if (cssVar.usages.some(usage => usage.property === 'text-align')) {
    const options = ['start', 'center', 'end'].map(valuesAsLabels);
    return <Fragment>
      <SelectControl
        {...{value, onChange, options}}
      />
      <TextControl
        value={ value }
        onChange={ onChange }
      />
    </Fragment>;
  }

  if (cssVar.usages.some(usage => usage.property === 'text-decoration')) {
    const options = [
      'none',
      'underline',
      'center',
    ].map(valuesAsLabels);
    return <SelectControl
      {...{value, onChange, options}}
    />;
  }

  return <Fragment>
    { !isNaN(value) && <input type={ 'number' } onChange={ e => onChange(e.target.value) } value={ value }/> }
    <TextControl
      value={ value }
      onChange={ onChange }
    />
  </Fragment>;
};
