import {SelectControl, TextControl} from '@wordpress/components';
import {Fragment} from 'react';
import {ShadowPicker} from 'react-shadow-picker';
import {FontFamilyControl} from './properties/FontFamilyControl';
import {ColorControl} from './properties/ColorControl';

export const COLOR_VALUE_REGEX = /(#[\da-fA-F]{3}|rgba?\()/;
export const GRADIENT_REGEX = /linear-gradient\(.+\)/;

const convertRemToPixels = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
const convertPixelsToRem = (px) => px / parseFloat(getComputedStyle(document.documentElement).fontSize);

const isPx = value => value && value.match(/[\d.]+px$/);
const isRem = value => value && value.match(/[\d.]+rem$/);
const isPercent = value => value && value.match(/\d%$/);
const isVh = value => value && value.match(/vh$/);
const isVw = value => value && value.match(/vw$/);
const valuesAsLabels = value => ({value: `${value}`, label: `${value}`});

export const TypedControl = ({ cssVar, theme, value, onChange, dispatch }) => {

  if (cssVar.usages.some(usage =>
    !!usage.property.match(/color$/)
    || ['background', 'fill', 'stroke'].includes(usage.property)
  )) {
    return <ColorControl {...{onChange, value, theme, cssVar, dispatch}}/>;
  }

  const sizeLikeProperties = [
    'font-size',
    'border',
    'border-width',
    'border-bottom',
    'border-bottom-width',
    'line-height',
    'border-radius',
    'margin',
    'margin-bottom',
    'margin-top',
    'margin-left',
    'margin-right',
    'padding',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'padding-top',
    'width',
    'height',
    'min-width',
    'max-width',
    'min-height',
    'max-height',
    'letter-spacing',
    'outline-offset',
    'top',
    'bottom',
    'left',
    'right',
    'outline-width',
    'outline-offset',
  ];

  if (cssVar.usages.some(usage => sizeLikeProperties.includes(usage.property))) {
    const pxValue = isPx(value) ? value.replace('px', '') : isRem(value) ? convertRemToPixels(parseFloat(value.replace('rem', ''))) : '';
    const remValue = isRem(value) ? value.replace('rem', '') : isPx(value) ? convertPixelsToRem(parseFloat(value.replace('px', ''))) : '';
    return <div className='theme-length-controls'>
      <div className={'theme-length-control control-px'} style={{clear: 'both'}}>
        <input
          type={ 'number' }
          value={pxValue}
          onChange={ event => {
            onChange(`${ event.currentTarget.value }px`);
          } }
        />
        <span>px</span>
      </div>
      <div className={'theme-length-control control-rem'}  >
        <input
          type={ 'number' }
          value={remValue}
          onChange={ event => {
            onChange(`${ event.currentTarget.value }rem`);
          } }
        />
        <span>rem</span>
      </div>
      <div className={'theme-length-control control-pct'}>
        <input
          type={ 'number' }
          value={ isPercent(value) ? value.replace('%', '') : ''}
          onChange={ event => {
            onChange(`${ event.currentTarget.value }%`);
          } }
        />
        <span>%</span>
      </div>
      <div className={'theme-length-control control-vh'}>
        <input
          type={ 'number' }
          value={ isVh(value) ? value.replace('vh', '') : ''}
          onChange={ event => {
            onChange(`${ event.currentTarget.value }vh`);
          } }
        />
        <span>vh</span>
      </div>
      <div className={'theme-length-control control-vw'}>
        <input
          type={ 'number' }
          value={ isVw(value) ? value.replace('vw', '') : ''}
          onChange={ event => {
            onChange(`${ event.currentTarget.value }vw`);
          } }
        />
        <span>vw</span>
      </div>
      <button
        disabled={value === 0 || value === '0'}
        onClick={() => {
          onChange('0');
        }}
      >0
      </button>
      <TextControl
        value={ value }
        onChange={ onChange }
      />
    </div>;
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
    const options = [
      'start',
      'end',
      'center',
    ].map(valuesAsLabels);
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
