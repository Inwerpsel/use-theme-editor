import React from 'react';
import { get } from '../../state';

export function IdeLink(props) {
  const {
    source,
    line,
    column,
    generated: {sheet: href},
  } = props;

  const {webpackHome, showSourceLinks} = get;

  if (!showSourceLinks || !source || !webpackHome) {
    return null;
  }

 const path = source.replace('webpack://', '');
  let dir = '';
  if (/\.\.\//.test(path)) {
    let levels = 0;
    let replaced, last;
    while (typeof last !== 'string' || last !== replaced) {
      levels++;
      last = replaced;
      replaced = path.replace('../', '');
    }

    const deepestFolderRegex = /\/[^\/]*$/;
    let targetDir = href.replace(deepestFolderRegex, '');
    for (let i = 0; i < levels; i++) {
      targetDir = targetDir.replace(deepestFolderRegex, '');
    }
    var a = document.createElement('a');
    a.href = targetDir;

    dir = 'use-theme-editor/docs/demo/' + a.pathname.replace(/^\//,'').replace(/\/$/, '') + '/';
  }

  // This protocol requires installing a handler on your system.
  return <a
    // href={`vscode://${path.replace(/^\//, '')}&line=${line}`}
    href={`vscode://file/${webpackHome}${dir}${path.replace(/^\//, '').replaceAll(/(\.\.\/)+/g, '')}:${line}:${column + 1}`}
    style={{color: 'blue', fontSize: '12px'}}
    onClick={e => e.stopPropagation()}
  >{source.replace('webpack://use-theme-editor/', '').replace('node_modules/', '')} {line}</a>;
}
