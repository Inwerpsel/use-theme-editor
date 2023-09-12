import React, { Fragment, useContext, useMemo, useState } from "react"
import { TextControl } from "../controls/TextControl";
import { COLOR_VALUE_REGEX } from "../properties/ColorControl";
import nameThatColor from '@yatiac/name-that-color';
import { ThemeEditorContext } from "../ThemeEditor";
import { ACTIONS } from "../../hooks/useThemeEditor";
import tinycolor from 'tinycolor2';

export function CreateAlias(props) {
    const {value} = props;
    const {dispatch} = useContext(ThemeEditorContext);
    const [open, setOpen] = useState(false);
    const [wasOpened, setWasOpened] = useState(false);

    const colorSuggestion = useMemo(() => {
        if (!wasOpened) {
            return null;
        }
        const parsed = tinycolor(value);
        if (parsed.isValid()) {
          const alphaSuffix = parsed.getAlpha() === 1 ? '' : ` ${parsed.getAlpha().toString().replace('.', '')}`;
          return nameThatColor(parsed.toHexString()).colorName.toLowerCase() + alphaSuffix;
        }
        if (COLOR_VALUE_REGEX.test(value)) {
          console.log('valid color not parsed by tinycolor (should not happen)');
          return nameThatColor(value).colorName.toLowerCase();
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