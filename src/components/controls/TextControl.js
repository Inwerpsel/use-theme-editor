import React from 'react';

export function TextControl( { label, value, className, instanceId, onChange, type = 'text', ...props } ) {
	const onChangeValue = ( event ) => onChange( event.target.value );

	return (
        <input className="components-text-control__input"
            {...{value,}}
            type={ 'text' }
            value={ value }
            onChange={ onChangeValue }
            { ...props }
        />
	);
}