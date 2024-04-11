import React from "react";
import { use } from "../../state";
import { Checkbox } from "../controls/Checkbox";

export function ColorSettings() {

    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        <Checkbox controls={use.includeDefaultPalette()}>
          Include default palette
        </Checkbox>
        <Checkbox controls={use.nativeColorPicker()}>
          Native color picker
        </Checkbox>
      </div>
    );
}

ColorSettings.fName = 'ColorSettings';