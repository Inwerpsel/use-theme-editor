import React, {Fragment} from 'react';
import {ShadowPicker} from 'react-shadow-picker';
import {FontFamilyControl} from '../properties/FontFamilyControl';
import {ColorControl} from '../properties/ColorControl';
import {SizeControl, sizeLikeProperties} from '../properties/SizeControl';
import {timeLikeProperties, TimeControl} from '../properties/TimeControl';
import { selectOnlyOptions } from './SelectOnlyControl';
import { SelectControl } from '../controls/SelectControl';
import { TextControl } from '../controls/TextControl';

export const valuesAsLabels = value => ({value: `${value}`, label: `${value}`});

// If any of the usages must be a <color>, then this restricts the type of the custom property,
// even if other usages would allow other types. Otherwise the color-only usages would be invalid.
// NOTE: for now this also includes background and background-image, because for now these have no
// separate control anyway for the other types they allow.
export const mustBeColor = cssVar => {
  return cssVar.usages.some(({property}) => property.match(/color$/)
    || ['background', 'background-image', 'fill', 'stroke'].includes(property)
    || (property === 'border' && cssVar.name.includes('color'))
  )
    
};

export const TypedControl = ({ cssVar, value, resolvedValue, onChange, cssFunc}) => {
  if (!/^--/.test(cssVar.name)) {
    // For now these can't be adjusted anyway, saves some performance.
    return null;
  }

  if (mustBeColor(cssVar)) {
    return <ColorControl {...{onChange, value, resolvedValue, cssVar, cssFunc}}/>;
  }

  if (cssVar.usages.some(usage => sizeLikeProperties.includes(usage.property))) {

    return <SizeControl{...{value, resolvedValue, onChange}}/>;
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


  const options = selectOnlyOptions(cssVar);
  if (options) {
    return <SelectControl
      {...{value, onChange, options: options.map(valuesAsLabels)}}
    />;
  }

  if (cssVar.usages.some(usage => usage.property === 'font-family')) {
    return <FontFamilyControl {...{value, onChange}}/>;
  }

  if ( cssVar.usages.some( usage => usage.property === 'box-shadow' || usage.property === 'text-shadow' ) ) {
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

  return (
    <Fragment>
      {!isNaN(value) && (
        <input
          type={'number'}
          onChange={(e) => onChange(e.target.value)}
          value={value}
        />
      )}
      {cssVar.usages.some((usage) => usage.property === 'text-transform') && (
        <button onClick={() => onChange('none')}>None</button>
      )}
      <TextControl value={value} onChange={onChange} />
    </Fragment>
  );
};
