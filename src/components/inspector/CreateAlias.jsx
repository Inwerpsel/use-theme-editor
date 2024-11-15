import React, { Fragment, useMemo, useState } from "react"
import { TextControl } from "../controls/TextControl";
import nameThatColor from '@yatiac/name-that-color';
import { ACTIONS, editTheme } from "../../hooks/useThemeEditor";
import { converter, formatHex, parse, clampGamut  } from 'culori';

// The library currently used has some color names with accents, like "screamin'".
const invalidNameChars = /[^\w\-]/;
const toRgb = converter('rgb');
export function CreateAlias(props) {
    const {value, origValue} = props;
    const dispatch = editTheme();
    const [open, setOpen] = useState(false);
    // Use separate state to avoid large lib going in and out of memory as you repeatedly open and close alias component.
    const [wasOpened, setWasOpened] = useState(false);

    const colorSuggestion = useMemo(() => {
        if (!wasOpened) {
            return null;
        }
        const parsed = parse(value);
        if (parsed) {
          const rgb = toRgb(clampGamut('rgb')(parsed));
          const {alpha = 1} = rgb;
          const alphaSuffix = alpha === 1 ? '' : ` ${alpha.toString().replace('.', '')}`;
          return nameThatColor(formatHex(rgb)).colorName.toLowerCase().replace(invalidNameChars, '') + alphaSuffix;
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
            dispatch({ type: ACTIONS.createAlias, payload: { name: name || colorSuggestion, value: origValue } });
        }}>submit</button>
        <button onClick={() => setOpen(false)}>cancel</button>
    </Fragment>
}