const lists = {
    'align-items': [
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