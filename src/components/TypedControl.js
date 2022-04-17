import {SelectControl, TextControl} from '@wordpress/components';
import React, {Fragment} from 'react';
import {ShadowPicker} from 'react-shadow-picker';
import {FontFamilyControl} from './properties/FontFamilyControl';
import {ColorControl} from './properties/ColorControl';
import {SizeControl, sizeLikeProperties} from './properties/SizeControl';
import {timeLikeProperties, TimeControl} from './properties/TimeControl';

export const valuesAsLabels = value => ({value: `${value}`, label: `${value}`});

export const isColorProperty = property => {
  return !!property && property.match(/color$/)
    || ['background', 'fill', 'stroke'].includes(property);
};

export const TypedControl = ({ cssVar, value, onChange}) => {

  if (cssVar.usages.some(usage => isColorProperty(usage.property))) {
    return <ColorControl {...{onChange, value, cssVar}}/>;
  }

  if (cssVar.usages.some(usage => sizeLikeProperties.includes(usage.property))) {

    return <SizeControl{...{value, onChange}}/>;
  }

  if (cssVar.usages.some(usage => timeLikeProperties.includes(usage.property))) {

    return <TimeControl{...{value, onChange}}/>;
  }

  if (cssVar.usages.some(usage => usage.property === 'font-weight')) {
    const numbers = [100, 200, 300, 400, 500, 600, 700, 800, 900].map(valuesAsLabels);
    const constants = ['normal', 'bold', 'lighter', 'bolder'].map(valuesAsLabels);

    const currentIsNumber = !value || /^-?\d+$/.test(value);

    return <div className={'font-weight-control'}>
      <SelectControl
        {...{value, onChange}}
        style={{fontStyle: !value || !currentIsNumber ? 'italic' : 'normal'}}
        options={[
          ...(value && currentIsNumber ? [] : [{value: '', label: '-- use a number --'}]),
          ...numbers,
        ]}
      />
      <SelectControl
        {...{value, onChange}}
        style={{fontStyle: !value || currentIsNumber ? 'italic' : 'normal'}}
        options={[
          ...(value && !currentIsNumber ? [] : [{value: '', label: '-- use a word --'}]),
          ...constants,
        ]}
      />
    </div>;
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
    return <Fragment>
      <ShadowPicker {...{value, onChange}}/>
      <TextControl {...{value, onChange}}/>
    </Fragment>;
  }

  if ( cssVar.usages.some( usage => usage.property === 'display' ) ) {
    const options = ['none', 'inline', 'inline-block', 'block', 'flex'].map(valuesAsLabels);
    return <SelectControl
      {...{value, onChange, options}}
    />;
  }

  if ( cssVar.usages.some( usage => usage.property === 'position' ) ) {
    const options = ['absolute', 'relative', 'fixed', 'sticky'].map(valuesAsLabels);
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
