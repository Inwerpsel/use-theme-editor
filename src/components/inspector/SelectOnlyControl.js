const alignOptions = [
        'normal',
        'stretch',
        'center',
        'start',
        'end',
        'flex-start',
        'flex-end',
        'baseline',
        'first baseline',
        'last baseline',
        'safe center',
        'unsafe center',
    ];

const lists = {
  'align-items': alignOptions,
  'align-content': alignOptions,
  'align-self': ['self-start', 'self-end', 'stretch', ...alignOptions],
  'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
  'justify-content': [
    'center',
    'start',
    'end',
    'flex-start',
    'flex-end',
    'left',
    'right',
    'normal',
    'space-between',
    'space-around',
    'space-evenly',
    'stretch',
    'safe center',
    'unsafe center',
  ],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  'border-collapse': ['separate', 'collapse'],
  'empty-cells': ['show', 'hide'],
  'font-variant-numeric': [
    'normal',
    'ordinal',
    'slashed-zero',
    'lining-nums' /* <numeric-figure-values> */,
    'oldstyle-nums' /* <numeric-figure-values> */,
    'proportional-nums' /* <numeric-spacing-values> */,
    'tabular-nums' /* <numeric-spacing-values> */,
    'diagonal-fractions' /* <numeric-fraction-values> */,
    'stacked-fractions' /* <numeric-fraction-values> */,
    'oldstyle-nums stacked-fractions',
  ],
  'scroll-behavior': ['auto', 'smooth'],
  'white-space': [
    'normal',
    'nowrap',
    'pre',
    'pre-wrap',
    'pre-line',
    'break-spaces',
  ],
  'word-break': [
    'normal',
    'wordbreak-all',
    'wordkeep-all',
    'wordbreak-word' /* deprecated */,
  ],
};

export function selectOnlyOptions(cssVar) {
    const {property} = cssVar.usages[0];
    return lists[property];
}

export function SelectOnlyControl({}) {
    const options = ['normal', 'italic'].map(valuesAsLabels);

    return <SelectControl
      {...{value, onChange, options}}
    />;
}