import React  from "react";
import { use } from "../../state";
import { TextControl } from "../controls/TextControl";

export function RemoveAnnoyingPrefix() {
  const [annoyingPrefix, setAnnoyingPrefix] = use.annoyingPrefix();

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