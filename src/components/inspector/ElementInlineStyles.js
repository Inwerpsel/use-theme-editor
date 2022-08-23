import React from 'react';

export function ElementInlineStyles(props) {
    const { group } = props;

    const entries = Object.entries(group.inlineStyles)

    if (entries.length === 0) {
        return null;
    }

    return <div>
        <h5 style={{color: 'red'}}>Inline styles</h5>
        <ul>
            {entries.map(([property, value]) => {
                return <li key={property}>
                    <span className='monospace-code'>{property}: {value}</span>
                    </li>;
            })}
        </ul>
    </div>
}