import React, { useContext } from "react";
import { ThemeEditorContext } from "../ThemeEditor";

export function RemoveAnnoyingPrefix() {
    const {
        annoyingPrefix, setAnnoyingPrefix,
    } = useContext(ThemeEditorContext);

    return <input 
      type='text'
      placeholder='Remove annoying prefix'
      title='Remove annoying prefix'
      value={annoyingPrefix}
      onChange={({target: {value}}) => {
        setAnnoyingPrefix(value);
      }}
      style={{
        textDecoration: 'line-through',
        textDecorationColor: 'grey',
        textDecorationThickness: '1px',
      }}
    />;
}