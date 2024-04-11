import { use } from "../../state";
import { Checkbox } from "../controls/Checkbox";

export function InformationVisibilitySettings() {
    const [showProps, setShowProps] = use.showCssProperties();

    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        <Checkbox
          id={'show-css-properties'}
          controls={[showProps, setShowProps]}
        >
          Show CSS properties
        </Checkbox>
        <Checkbox id={'link-css-properties'} controls={use.linkCssProperties()}>
          Link CSS properties
        </Checkbox>
        <Checkbox id={'show-source-links'} controls={use.showSourceLinks()}>
          Show source links
        </Checkbox>
      </div>
    );
}

InformationVisibilitySettings.fName = 'InformationVisibilitySettings';