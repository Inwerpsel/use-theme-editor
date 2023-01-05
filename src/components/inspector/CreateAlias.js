import { Fragment, useContext, useState } from "react"
import { TextControl } from "../controls/TextControl";
import { COLOR_VALUE_REGEX } from "../properties/ColorControl";
import nameThatColor from '@yatiac/name-that-color';
import { ThemeEditorContext } from "../ThemeEditor";
import { ACTIONS } from "../../hooks/useThemeEditor";

export function CreateAlias(props) {
    const {value} = props;
    const {dispatch} = useContext(ThemeEditorContext);
    const [open, setOpen] = useState(false);

    const [name, setName] = useState(() => {
        if (COLOR_VALUE_REGEX.test(value)) {
            return nameThatColor(value).colorName;
        }
        return '';
    });

    if (!open) {
        return <button onClick={() => setOpen(true)}>Add alias</button>
    }

    return <Fragment>
        <TextControl value={name} onChange={setName} />
        <button onClick={() => {
            dispatch({type: ACTIONS.createAlias, payload: {name, value}})
        }}>submit</button>
        <button onClick={() => setOpen(false)}>cancel</button>
    </Fragment>
}