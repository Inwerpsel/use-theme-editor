import { useEffect, useState } from "react"
import { Checkbox } from "../../components/controls/Checkbox";

const events = [
//   'pointerover',
//   'pointerenter',
//   'pointerdown',
  'pointermove',
//   'pointerup',
//   'pointercancel',
//   'pointerout',
//   'pointerleave',
//   'pointerrawupdate',
//   'gotpointercapture',
//   'lostpointercapture',
];

const factor = 2 * 90 / Math.PI;
function toDegrees(radians) {
    return parseFloat(radians) * factor;
}

function verbatim(v) {
  return v;
}

const props = {
    // Stylus only
    altitudeAngle: toDegrees,
    azimuthAngle: toDegrees,
    tiltX: verbatim,
    tiltY: verbatim,
    // twist: verbatim, // does not seem to work
    // pressure: verbatim,

    // Fingers only, contact surface, not very useful
    // width: verbatim,
    // height: verbatim,
};

let totalCount = 0;

const count = new Map();
const lastData = new Map();

function log(name, setLastEvent, event) {
    count.set(name, (count.get(name) || 0) + 1);
    totalCount++;
    const data = {};
    for (const [p, format] of Object.entries(props)) {
        const value = event[p];
        data[p] = format(value);
    }
    lastData.set(name, data);
    setLastEvent(event);
}


export function LastPointerEvents() {
    const [on, setOn] = useState(true);
    const [, setLastEvent] = useState(null);

    useEffect(() => {
        if (on) {
            const listeners = [];
            for (const name of events) {
                const listener = log.bind(null, name, setLastEvent);
                listeners.push([name, listener]);
                document.addEventListener(name, listener)
            }
            return () => {
                for (const [name, listener] of listeners) {
                    document.removeEventListener(name, listener);
                }
            };
        }
    }, [on]);

    return <code>
      <Checkbox controls={[on, setOn]}>Enable</Checkbox>
      {events.map(name => <div key={name} style={{whiteSpace: 'pre-wrap'}}>
        {name} ({count.get(name)})
        last: {JSON.stringify(lastData.get(name), null, 2)}
      </div>)}
      <br />
      total captured: {totalCount}
    </code>
}
LastPointerEvents.fName = 'LastPointerEvents';