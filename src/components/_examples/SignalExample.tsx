import React, { Fragment, useState } from "react";
import { $ } from "../../state";
import { Checkbox } from "../controls/Checkbox";

function TimeAtRender() {
    return <time>{Date.now()}</time>
}

// I left console logging so that it's easier to inspect the rerender behavior by uncommenting them.

// Unaware component level 2.
// The component uses the signal as a primitve value in its own logic.
function FormatProp({prop}) {
    // console.log('FormatProp');
    return `The prop says "${prop}"`;
}

// Unaware component level 2.
// Since this one only puts attr in JSX, it won't itself be rerendered.
function FormatPropJSX({prop}: {prop: string}) {
    // console.log('FormatPropJSX');
    return <Fragment>The prop says "{prop}"</Fragment>;
}

// Unaware component level 2.
// This type of usage does not cause coercion to a primitive value.
// As a result, it will not call the hook and obviously won't receive
// the right value.
// Since the attr is always the same object, this component will never
// rerender.
function INCOMPATIBLE__FormatProp({attr}) {
    // console.log('INCOMPATIBLE__FormatProp');
    return <span>
        {attr === 'all' ? 'The prop is equal to "all"' : 'The prop is not equal to "all"'}
    </span>
}

// Unaware component level 1.
function ShowProp({prop, area}) {
    const areaDouble = area * 2;
    // console.log(prop, area);

    return <div>
        <span>
            <FormatProp prop={prop} />
            <br />
            <FormatPropJSX prop={prop} />
            <br />
            <b>Expected to not work: </b>
            <br />
            <INCOMPATIBLE__FormatProp attr={prop} />
        </span>
        <div>
            {/* <input type="text" value={$.annoyingPrefix} /> */}
        </div>
        <div>
            {areaDouble}
        </div>
        <div>
            <TimeAtRender />
        </div>
    </div>
}

export function SignalExample() {
    const [on, setOn] = useState(true)
    return <div>
        <h2>Signal example</h2>
        <p>
            The current area is {$.width} * {$.height} = {$.area}. * 2 = {$.areaDoubled}
            This string was rendered at <TimeAtRender />, yet the values are always up to date.
        </p>
        <p>
            Area without memo: {$.areaNomemo}
        </p>
        <h3>Get value conditionally</h3>
        <p>
            <Checkbox controls={[on, setOn]}>memo</Checkbox>
            <br/>
            { !on ? 'Avoided calling signal' : $.area}
        </p>
        <h3>Inject into unaware components</h3>
        <p>
            <ShowProp prop={$.propertyFilter} area={$.area} />
        </p>
    </div>
}