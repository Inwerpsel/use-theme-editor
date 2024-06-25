import React  from "react";
import { get, use } from "../../state";
import { TextControl } from "../controls/TextControl";
import { Tutorial } from "../../_unstable/Tutorial";
import { DragHandle } from "../movable/DragHandle";

export function RemoveAnnoyingPrefix() {
  const [annoyingPrefix, setAnnoyingPrefix] = use.annoyingPrefix();

  return <div>
    <Tutorial
      el={RemoveAnnoyingPrefix}
      tasks={[() => [
        'Ignore either "bs" or "lm"',
        ['lm', 'bs'].includes(get.annoyingPrefix)
      ]]}
      >
        It's very common for token names to all start with a prefix that takes up valuable screen real estate.

        In case of Bootstrap it's "bs", for Halfmoon you find a lot of redundant "lm" prefixes.
    </Tutorial>
    <DragHandle />
    <TextControl
      placeholder='Remove annoying prefix'
      title='Remove annoying prefix'
      value={annoyingPrefix}
      onChange={setAnnoyingPrefix}
      style={{
        textDecoration: 'line-through',
        textDecorationColor: 'grey',
        textDecorationThickness: '1px',
      }}
    />
  </div>;
}

RemoveAnnoyingPrefix.fName = 'RemoveAnnoyingPrefix';