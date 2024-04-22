import React, { Fragment, useMemo, useState } from "react"
import { TextControl } from "../controls/TextControl";
import { COLOR_VALUE_REGEX } from "../properties/ColorControl";
import nameThatColor from '@yatiac/name-that-color';
import { ACTIONS, editTheme } from "../../hooks/useThemeEditor";
import tinycolor from 'tinycolor2';

// The library currently used has some color names with accents, like "screamin'".
const invalidNameChars = /[^\w\-]/;

export function CreateAlias(props) {
    const {value} = props;
    const dispatch = editTheme();
    const [open, setOpen] = useState(false);
    // Use separate state to avoid large lib going in and out of memory as you repeatedly open and close alias component.
    const [wasOpened, setWasOpened] = useState(false);

    const colorSuggestion = useMemo(() => {
        if (!wasOpened) {
            return null;
        }
        // No valid syntax besides hsl can include the string "deg".
        // In theory, it's possible removing "deg" makes certain invalid color strings valid,
        // but that's not a problem here.
        const parsed = tinycolor(value.replace('deg', ''));
        if (parsed.isValid()) {
          const alphaSuffix = parsed.getAlpha() === 1 ? '' : ` ${parsed.getAlpha().toString().replace('.', '')}`;
          return nameThatColor(parsed.toHexString()).colorName.toLowerCase().replace(invalidNameChars, '') + alphaSuffix;
        }
        if (COLOR_VALUE_REGEX.test(value)) {
          console.log('valid color not parsed by tinycolor (should not happen)');
          return nameThatColor(value).colorName.toLowerCase().replace(invalidNameChars, '');
        }
        return '';
    } , [wasOpened])

    const [name, setName] = useState('');

    if (!open) {
        return (
          <button
            onClick={() => {
              setWasOpened(true);
              setOpen(true);
            }}
          >
            Add alias
          </button>
        );
    }

    return <Fragment>
        <TextControl value={name || colorSuggestion} onChange={setName} />
        <button onClick={() => {
            dispatch({ type: ACTIONS.createAlias, payload: { name: name || colorSuggestion, value } });
        }}>submit</button>
        <button onClick={() => setOpen(false)}>cancel</button>
    </Fragment>
}