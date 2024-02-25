import React  from "react";
import { use } from "../../state";
import { TextControl } from "../controls/TextControl";

export function WebpackHomeInput() {
    const [webpackHome, setWebpackHome] = use.webpackHome();

    return (
      <TextControl
        style={{ width: '100%' }}
        value={webpackHome}
        onChange={(v) => setWebpackHome(v)}
        label="Webpack home"
        placeholder="webpack home path"
        title="Enter the root folder on your system for this page to open source links in VSCode"
      />
    );
}