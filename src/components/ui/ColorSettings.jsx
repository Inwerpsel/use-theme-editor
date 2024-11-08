import React from "react";
import { use } from "../../state";
import { Checkbox } from "../controls/Checkbox";

export function ColorSettings() {

    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        <Checkbox controls={use.includeDefaultPalette()}>
          Include default palette
        </Checkbox>
        <Checkbox title="Disable this to get the best experience" controls={use.nativeColorPicker()}>
          Native color picker
        </Checkbox>
        <Checkbox controls={use.maximizeChroma()}>
          Maximize chroma when dropping
        </Checkbox>
      </div>
    );
}

ColorSettings.fName = 'ColorSettings';