import { useState } from "react";
import { $ } from "../../state";
import { Checkbox } from "../controls/Checkbox";

function TimeAtRender() {
    return <time>{Date.now()}</time>
}

export function SignalExample() {
    const [on, setOn] = useState(true)
    return <div>
        <h2>Signal example</h2>
        <p>
            The current area is {$.width} * {$.height} = {$.area}.
            This string was rendered at <TimeAtRender />, yet the values are always up to date.
        </p>
        <p>
            Area without memo: {$.areaNomemo}
        </p>
        <p>
            Twice the area: {$.areaDoubled}
        </p>

        <h3>Get value conditionally</h3>
        <p>
            <Checkbox controls={[on, setOn]}>memo</Checkbox>
            <br/>
            { !on ? 'No expensive memo done' : $.area}
        </p>
    </div>
}