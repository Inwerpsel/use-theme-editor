import React  from "react";
import { use } from "../../state";
import { TextControl } from "../controls/TextControl";

export function WebpackHomeInput() {
    const [webpackHome, setWebpackHome] = use.webpackHome();

    return <TextControl value={webpackHome} onChange={v => setWebpackHome(v)} label='Webpack home'/>;
}