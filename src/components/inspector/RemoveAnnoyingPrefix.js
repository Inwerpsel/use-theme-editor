import React, { useContext } from "react";
import { TextControl } from "../controls/TextControl";
import { ThemeEditorContext } from "../ThemeEditor";

export function RemoveAnnoyingPrefix() {
    const {
        annoyingPrefix, setAnnoyingPrefix,
    } = useContext(ThemeEditorContext);

    return <TextControl
      placeholder='Remove annoying prefix'
      title='Remove annoying prefix'
      value={annoyingPrefix}
      onChange={setAnnoyingPrefix}
      style={{
        textDecoration: 'line-through',
        textDecorationColor: 'grey',
        textDecorationThickness: '1px',
      }}
    />;
}