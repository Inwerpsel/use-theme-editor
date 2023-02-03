import { use } from "../../state";
import { Checkbox } from "../controls/Checkbox";

export function InformationVisibilitySettings() {

    return <div style={{ display: 'flex', gap: '4px' }}>
    <Checkbox
        id={'show-css-properties'}
        controls={use.showCssProperties()}
    >
        Show CSS properties
    </Checkbox>
    <Checkbox
        id={'show-source-links'}
        controls={use.showSourceLinks()}
    >
        Show source links
    </Checkbox>
    </div>;
}